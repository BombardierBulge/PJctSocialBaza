import { Request, Response } from 'express';
import { getRepository, getConnection } from 'typeorm';
import { User } from '../entity/User';
import { UserPassword } from '../entity/UserPassword';
import bcrypt from 'bcrypt';

export const AuthController = {
    login: async (req: Request, res: Response) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username/Email and password required' });
        }

        try {
            // 1. Find User by Username OR Email in Main DB
            const userRepository = getRepository(User, 'main');
            const users = await userRepository.query(
                `SELECT u.*, up."avatarUrl" 
                 FROM users u
                 LEFT JOIN user_profile up ON u.user_id = up."userId"
                 WHERE u.username = $1 OR u.email = $1`,
                [username]
            );
            const user = users[0];

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials (User not found)' });
            }

            // 2. Get Password from Auth DB using user_id
            const authRepository = getRepository(UserPassword, 'auth');
            const authDataArray = await authRepository.query(
                `SELECT * FROM user_passwords WHERE user_id = $1`,
                [user.user_id]
            );
            const authData = authDataArray[0];

            if (!authData) {
                // User exists but has no password record? Edge case.
                return res.status(401).json({ error: 'Invalid credentials (No password set)' });
            }

            // 3. Compare Password
            const isPasswordValid = await bcrypt.compare(password, authData.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            res.json({ message: 'Login successful', user });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    register: async (req: Request, res: Response) => {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Missing fields' });
        }

        const saltRounds = 10;
        const connection = getConnection('main');
        const queryRunner = connection.createQueryRunner();
        const authRepository = getRepository(UserPassword, 'auth');

        await queryRunner.connect();

        try {
            // Rozpoczęcie transakcji
            await queryRunner.query('BEGIN');

            // Sprawdzenie czy użytkownik już istnieje
            const existing = await queryRunner.query(
                `SELECT * FROM users WHERE username = $1 OR email = $2`,
                [username, email]
            );
            if (existing.length > 0) {
                await queryRunner.query('ROLLBACK');
                return res.status(400).json({ error: 'User already exists' });
            }

            // Utworzenie użytkownika
            const userResult = await queryRunner.query(
                `INSERT INTO users (username, email, created_at, is_admin) VALUES ($1, $2, NOW(), false) RETURNING user_id`,
                [username, email]
            );
            const userId = userResult[0].user_id;

            // Utworzenie profilu
            await queryRunner.query(
                `INSERT INTO user_profile ("userId") VALUES ($1)`,
                [userId]
            );

            // Utworzenie hasła (w bazie Auth)
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            await authRepository.query(
                `INSERT INTO user_passwords (user_id, password_hash) VALUES ($1, $2)`,
                [userId, hashedPassword]
            );

            // Zatwierdzenie transakcji
            await queryRunner.query('COMMIT');
            res.status(201).json({ message: 'User created', userId });
        } catch (err) {
            // ROLLBACK w przypadku błędu
            await queryRunner.query('ROLLBACK');
            res.status(500).json({ error: (err as Error).message });
        } finally {
            await queryRunner.release();
        }
    },

    getAllPasswords: async (req: Request, res: Response) => {
        try {
            const authRepository = getRepository(UserPassword, 'auth');
            const passwords = await authRepository.query(`SELECT * FROM user_passwords`);
            res.json(passwords);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
};
