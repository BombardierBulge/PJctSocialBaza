import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { User } from '../entity/User';
import { UserProfile } from '../entity/UserProfile';
import { Follow } from '../entity/Follow';
import fs from 'fs';
import path from 'path';

export const UserController = {
    getAllUsers: async (req: Request, res: Response) => {
        try {
            const userRepository = getRepository(User, 'main');
            const users = await userRepository.query(`SELECT * FROM users`);
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    getUserById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            const userRepository = getRepository(User, 'main');
            const users = await userRepository.query(`SELECT * FROM users WHERE user_id = $1`, [id]);
            const user = users[0];

            if (user) {
                // Pobranie postów
                const posts = await userRepository.query(`SELECT * FROM posts WHERE user_id = $1`, [id]);
                user.posts = posts;
            }

            res.json(user);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    searchUsers: async (req: Request, res: Response) => {
        try {
            const query = req.params.q;
            if (!query) return res.json([]);

            const userRepository = getRepository(User, 'main');
            const users = await userRepository.query(
                `SELECT u.*, up."avatarUrl", 
           (SELECT COUNT(*) FROM follows WHERE followed_id = u.user_id) as follower_count
           FROM users u
           LEFT JOIN user_profile up ON u.user_id = up."userId"
           WHERE u.username ILIKE $1
           ORDER BY follower_count DESC`,
                [`%${query}%`]
            );

            res.json(users);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    getAllProfiles: async (req: Request, res: Response) => {
        try {
            const profileRepository = getRepository(UserProfile, 'main');
            const profiles = await profileRepository.query(`
          SELECT up.*, u.username 
          FROM user_profile up
          JOIN users u ON up."userId" = u.user_id
        `);
            res.json(profiles);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    getProfileByUserId: async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.userId);
            const profileRepository = getRepository(UserProfile, 'main');

            const profiles = await profileRepository.query(`SELECT * FROM user_profile WHERE "userId" = $1`, [userId]);
            const users = await profileRepository.query(`SELECT * FROM users WHERE user_id = $1`, [userId]);

            const profile = profiles[0];
            const user = users[0];

            if (!user && !profile) return res.status(404).json({ error: 'Not found' });

            if (user) {
                const posts = await profileRepository.query(`SELECT * FROM posts WHERE user_id = $1`, [userId]);
                user.posts = posts;
            }

            // Pobranie liczników
            const followers = await profileRepository.query(`SELECT COUNT(*) as count FROM follows WHERE followed_id = $1`, [userId]);
            const following = await profileRepository.query(`SELECT COUNT(*) as count FROM follows WHERE follower_id = $1`, [userId]);

            if (user) {
                user.follower_count = parseInt(followers[0].count);
                user.following_count = parseInt(following[0].count);
            }

            res.json({ user, profile });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    updateAvatar: async (req: Request, res: Response) => {
        const connection = getRepository(UserProfile, 'main').manager.connection;
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();

        try {
            const userId = parseInt(req.headers['x-user-id'] as string);
            if (Number.isNaN(userId)) {
                return res.status(400).json({ error: 'Missing or invalid user ID' });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const avatarUrl = `/uploads/${req.file.filename}`;

            // BEGIN transakcji
            await queryRunner.query('BEGIN');

            const profiles = await queryRunner.query(`SELECT * FROM user_profile WHERE "userId" = $1`, [userId]);

            if (profiles.length === 0) {
                await queryRunner.query(
                    `INSERT INTO user_profile ("userId", "avatarUrl", bio) VALUES ($1, $2, '')`,
                    [userId, avatarUrl]
                );
            } else {
                await queryRunner.query(
                    `UPDATE user_profile SET "avatarUrl" = $1 WHERE "userId" = $2`,
                    [avatarUrl, userId]
                );
            }

            // COMMIT transakcji
            await queryRunner.query('COMMIT');

            res.json({ message: 'Avatar updated', avatarUrl });
        } catch (error) {
            // ROLLBACK w przypadku błędu
            await queryRunner.query('ROLLBACK');
            res.status(500).json({ error: (error as Error).message });
        } finally {
            await queryRunner.release();
        }
    },

    updateProfile: async (req: Request, res: Response) => {
        const connection = getRepository(UserProfile, 'main').manager.connection;
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();

        try {
            const userId = parseInt(req.headers['x-user-id'] as string);
            const { bio, location, website } = req.body;

            if (Number.isNaN(userId)) {
                return res.status(400).json({ error: 'Missing or invalid user ID' });
            }

            // BEGIN transakcji
            await queryRunner.query('BEGIN');

            const profiles = await queryRunner.query(`SELECT * FROM user_profile WHERE "userId" = $1`, [userId]);

            if (profiles.length === 0) {
                await queryRunner.query(
                    `INSERT INTO user_profile ("userId", bio, location, website) VALUES ($1, $2, $3, $4)`,
                    [userId, bio || '', location || '', website || '']
                );
            } else {
                await queryRunner.query(
                    `UPDATE user_profile SET bio = $1, location = $2, website = $3 WHERE "userId" = $4`,
                    [bio || '', location || '', website || '', userId]
                );
            }

            // COMMIT transakcji
            await queryRunner.query('COMMIT');

            res.json({ message: 'Profile updated' });
        } catch (error) {
            // ROLLBACK w przypadku błędu
            await queryRunner.query('ROLLBACK');
            res.status(500).json({ error: (error as Error).message });
        } finally {
            await queryRunner.release();
        }
    }

};
