import { Request, Response } from 'express';
import { getRepository, getConnection } from 'typeorm';
import { User } from '../entity/User';
import fs from 'fs';

export const AdminController = {
    toggleAdmin: async (req: Request, res: Response) => {
        const requesterId = parseInt(req.headers['x-user-id'] as string);
        const { target_user_id } = req.body;

        if (Number.isNaN(requesterId) || !target_user_id) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const connection = getConnection('main');
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();

        try {
            // BEGIN transakcji
            await queryRunner.query('BEGIN');

            // Sprawdzenie Zlecającego
            const requesters = await queryRunner.query(`SELECT is_admin, username FROM users WHERE user_id = $1`, [requesterId]);
            const requester = requesters[0];

            if (!requester || !requester.is_admin) {
                await queryRunner.query('ROLLBACK');
                return res.status(403).json({ error: 'Forbidden: Admins only' });
            }

            // Sprawdzenie Celu
            const targets = await queryRunner.query(`SELECT is_admin, username FROM users WHERE user_id = $1`, [target_user_id]);
            const target = targets[0];
            if (!target) {
                await queryRunner.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }

            // Zmiana statusu
            const newStatus = !target.is_admin;
            await queryRunner.query(`UPDATE users SET is_admin = $1 WHERE user_id = $2`, [newStatus, target_user_id]);

            // COMMIT transakcji
            await queryRunner.query('COMMIT');

            // Logowanie (poza transakcją)
            const logMessage = `[${new Date().toISOString()}] ADMIN ACTION: User ${requester.username} (ID: ${requesterId}) changed admin status of ${target.username} (ID: ${target_user_id}) to ${newStatus}\n`;
            fs.appendFile('admin_actions.log', logMessage, (err) => {
                if (err) console.error('Failed to write to admin log', err);
            });

            res.json({ message: `User ${target_user_id} admin status changed to ${newStatus}`, is_admin: newStatus });
        } catch (error) {
            // ROLLBACK w przypadku błędu
            await queryRunner.query('ROLLBACK');
            res.status(500).json({ error: (error as Error).message });
        } finally {
            await queryRunner.release();
        }
    }
};
