import { Request, Response } from 'express';
import { getRepository, getConnection } from 'typeorm';
import { Comment } from '../entity/Comment';
import { Like } from '../entity/Like';
import { Follow } from '../entity/Follow';
import { User } from '../entity/User';

export const InteractionController = {
    getAllComments: async (req: Request, res: Response) => {
        try {
            const commentRepository = getRepository(Comment, 'main');
            const comments = await commentRepository.query(`SELECT * FROM comments`);
            res.json(comments);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    getCommentsByPostId: async (req: Request, res: Response) => {
        try {
            const postId = parseInt(req.params.postId);
            if (Number.isNaN(postId)) return res.status(400).json({ error: 'Invalid postId' });
            const commentRepository = getRepository(Comment, 'main');
            const comments = await commentRepository.query(`
          SELECT c.*, u.username 
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.user_id
          WHERE c.post_id = $1
      `, [postId]);

            const mapped = comments.map((c: any) => ({
                ...c,
                user: { username: c.username }
            }));
            res.json(mapped);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    createComment: async (req: Request, res: Response) => {
        const { user_id, post_id, content } = req.body;
        if (!user_id || !post_id || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        try {
            const commentRepository = getRepository(Comment, 'main');
            const insertSql = `
        INSERT INTO comments (user_id, post_id, content, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
            const result = await commentRepository.query(insertSql, [user_id, post_id, content]);
            const newComment = result[0];

            const userRes = await commentRepository.query(`SELECT username FROM users WHERE user_id = $1`, [user_id]);
            if (userRes[0]) {
                newComment.user = { username: userRes[0].username };
            }

            res.status(201).json(newComment);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    deleteComment: async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const user_id = parseInt(req.headers['x-user-id'] as string);

        if (Number.isNaN(id) || Number.isNaN(user_id)) {
            return res.status(400).json({ error: 'Invalid ID or auth header' });
        }

        const connection = getConnection('main');
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();

        try {
            // Rozpoczęcie transakcji
            await queryRunner.query('BEGIN');

            const comments = await queryRunner.query(`SELECT * FROM comments WHERE comment_id = $1`, [id]);
            const comment = comments[0];

            if (!comment) {
                await queryRunner.query('ROLLBACK');
                return res.status(404).json({ error: 'Comment not found' });
            }

            // Sprawdzenie uprawnień (Admin lub Właściciel)
            const users = await queryRunner.query(`SELECT is_admin FROM users WHERE user_id = $1`, [user_id]);
            const is_admin = users[0] ? users[0].is_admin : false;

            if (comment.user_id !== user_id && !is_admin) {
                await queryRunner.query('ROLLBACK');
                return res.status(403).json({ error: 'Forbidden' });
            }

            await queryRunner.query(`DELETE FROM comments WHERE comment_id = $1`, [id]);

            // Zatwierdzenie transakcji
            await queryRunner.query('COMMIT');
            res.json({ message: 'Comment deleted' });
        } catch (error) {
            // Wycofanie transakcji w przypadku błędu
            await queryRunner.query('ROLLBACK');
            res.status(500).json({ error: (error as Error).message });
        } finally {
            await queryRunner.release();
        }
    },

    updateComment: async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const user_id = parseInt(req.headers['x-user-id'] as string);
        const { content } = req.body;

        if (Number.isNaN(id) || Number.isNaN(user_id) || !content) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const commentRepository = getRepository(Comment, 'main');

        try {
            const comments = await commentRepository.query(`SELECT * FROM comments WHERE comment_id = $1`, [id]);
            const comment = comments[0];

            if (!comment) return res.status(404).json({ error: 'Comment not found' });

            if (comment.user_id !== user_id) {
                return res.status(403).json({ error: 'Forbidden: You can only edit your own comments' });
            }

            await commentRepository.query(`UPDATE comments SET content = $1 WHERE comment_id = $2`, [content, id]);
            res.json({ message: 'Comment updated' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    // --- LIKES ---
    getAllLikes: async (req: Request, res: Response) => {
        try {
            const likeRepository = getRepository(Like, 'main');
            const likes = await likeRepository.query(`SELECT * FROM likes`);
            res.json(likes);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    getLikesByPostId: async (req: Request, res: Response) => {
        try {
            const postId = parseInt(req.params.postId);
            if (Number.isNaN(postId)) return res.status(400).json({ error: 'Invalid postId' });
            const likeRepository = getRepository(Like, 'main');
            const likes = await likeRepository.query(`SELECT * FROM likes WHERE post_id = $1`, [postId]);
            res.json(likes);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    toggleLike: async (req: Request, res: Response) => {
        const { user_id, post_id } = req.body;
        if (!user_id || !post_id) {
            return res.status(400).json({ error: 'Missing user_id or post_id' });
        }

        try {
            const likeRepository = getRepository(Like, 'main');
            const existingLikes = await likeRepository.query(
                `SELECT * FROM likes WHERE user_id = $1 AND post_id = $2`,
                [user_id, post_id]
            );

            if (existingLikes.length > 0) {
                await likeRepository.query(
                    `DELETE FROM likes WHERE user_id = $1 AND post_id = $2`,
                    [user_id, post_id]
                );
                return res.json({ message: 'Unliked', liked: false });
            } else {
                await likeRepository.query(
                    `INSERT INTO likes (user_id, post_id) VALUES ($1, $2)`,
                    [user_id, post_id]
                );
                return res.json({ message: 'Liked', liked: true });
            }
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    // --- FOLLOWS ---
    getAllFollows: async (req: Request, res: Response) => {
        try {
            const followerId = req.query.follower_id ? parseInt(req.query.follower_id as string) : null;
            const followRepository = getRepository(Follow, 'main');

            let follows;
            if (followerId && !Number.isNaN(followerId)) {
                follows = await followRepository.query(`
                SELECT f.*, u.username as followed_name, up."avatarUrl" as followed_avatar
                FROM follows f
                JOIN users u ON f.followed_id = u.user_id
                LEFT JOIN user_profile up ON u.user_id = up."userId"
                WHERE f.follower_id = $1
            `, [followerId]);
            } else {
                follows = await followRepository.query(`
                SELECT f.*, u.username as followed_name 
                FROM follows f
                JOIN users u ON f.followed_id = u.user_id
            `);
            }

            res.json(follows);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    toggleFollow: async (req: Request, res: Response) => {
        const { follower_id, followed_id } = req.body;

        if (!follower_id || !followed_id) return res.status(400).json({ error: 'Missing ids' });
        if (follower_id === followed_id) return res.status(400).json({ error: 'Cannot follow yourself' });

        try {
            const followRepository = getRepository(Follow, 'main');
            const existingFollows = await followRepository.query(
                `SELECT * FROM follows WHERE follower_id = $1 AND followed_id = $2`,
                [follower_id, followed_id]
            );

            if (existingFollows.length > 0) {
                // Unfollow
                await followRepository.query(
                    `DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2`,
                    [follower_id, followed_id]
                );
                res.json({ message: 'Unfollowed', following: false });
            } else {
                // Follow
                await followRepository.query(
                    `INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)`,
                    [follower_id, followed_id]
                );
                res.json({ message: 'Followed', following: true });
            }
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
};
