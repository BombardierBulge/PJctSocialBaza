import { Request, Response } from 'express';
import { getRepository, getConnection } from 'typeorm';
import { Post } from '../entity/Post';
import { User } from '../entity/User';

export const PostController = {
    getAllPosts: async (req: Request, res: Response) => {
        try {
            const postRepository = getRepository(Post, 'main');
            const sql = `
        SELECT p.*, 
               u.username, u.email, 
               up."avatarUrl"
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.user_id
        LEFT JOIN user_profile up ON u.user_id = up."userId"
        ORDER BY p.created_at DESC
      `;
            const rawPosts = await postRepository.query(sql);

            const likes = await postRepository.query(`SELECT * FROM likes`);
            const comments = await postRepository.query(`
          SELECT c.*, u.username as author_name 
          FROM comments c 
          LEFT JOIN users u ON c.user_id = u.user_id
          ORDER BY c.created_at ASC
      `);

            const posts = rawPosts.map((p: any) => ({
                post_id: p.post_id,
                user_id: p.user_id,
                content: p.content,
                created_at: p.created_at,
                updated_at: p.updated_at,
                image_url: p.image_url,
                user: {
                    username: p.username,
                    avatarUrl: p.avatarUrl
                },
                likes: likes.filter((l: any) => l.post_id === p.post_id),
                comments: comments.filter((c: any) => c.post_id === p.post_id).map((c: any) => ({
                    ...c,
                    user: { username: c.author_name }
                }))
            }));

            res.json(posts);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    getPostById: async (req: Request, res: Response) => {
        try {
            const id = parseInt(req.params.id);
            if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
            const postRepository = getRepository(Post, 'main');

            // Raw SQL
            const posts = await postRepository.query(`SELECT * FROM posts WHERE post_id = $1`, [id]);
            const post = posts[0];

            if (!post) return res.status(404).json({ error: 'Post not found' });

            // Fetch relations manually
            const repository = getRepository(User, 'main');
            const users = await repository.query(`SELECT * FROM users WHERE user_id = $1`, [post.user_id]);
            post.user = users[0];

            post.likes = await repository.query(`SELECT * FROM likes WHERE post_id = $1`, [id]);
            post.comments = await repository.query(`SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC`, [id]);

            res.json(post);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    createPost: async (req: Request, res: Response) => {
        const { user_id, content } = req.body;
        // Basic validations
        if (!user_id || !content) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        const connection = getConnection('main');
        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();

        try {
            // Rozpoczęcie transakcji
            await queryRunner.query('BEGIN');

            // Sprawdzenie użytkownika
            const users = await queryRunner.query(`SELECT user_id FROM users WHERE user_id = $1`, [user_id]);
            if (users.length === 0) {
                await queryRunner.query('ROLLBACK');
                return res.status(404).json({ error: 'User not found' });
            }

            // Utworzenie posta
            const insertSql = `
                INSERT INTO posts (user_id, content, created_at, updated_at)
                VALUES ($1, $2, NOW(), NOW())
                RETURNING *
            `;
            const result = await queryRunner.query(insertSql, [user_id, content]);
            const savedPost = result[0];

            // Zatwierdzenie transakcji
            await queryRunner.query('COMMIT');
            return res.status(201).json(savedPost);
        } catch (err) {
            // Wycofanie transakcji
            await queryRunner.query('ROLLBACK');
            res.status(500).json({ error: (err as Error).message });
        } finally {
            await queryRunner.release();
        }
    },

    updatePost: async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const user_id = parseInt(req.headers['x-user-id'] as string);
        const { content } = req.body;

        if (Number.isNaN(id) || Number.isNaN(user_id) || !content) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        try {
            const postRepository = getRepository(Post, 'main');
            const posts = await postRepository.query(`SELECT * FROM posts WHERE post_id = $1`, [id]);
            const post = posts[0];

            if (!post) return res.status(404).json({ error: 'Post not found' });
            if (post.user_id !== user_id) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            await postRepository.query(
                `UPDATE posts SET content = $1, updated_at = NOW() WHERE post_id = $2`,
                [content, id]
            );

            res.json({ message: 'Post updated successfully' });
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    },

    deletePost: async (req: Request, res: Response) => {
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

            const posts = await queryRunner.query(`SELECT * FROM posts WHERE post_id = $1`, [id]);
            const post = posts[0];

            if (!post) {
                await queryRunner.query('ROLLBACK');
                return res.status(404).json({ error: 'Post not found' });
            }

            const users = await queryRunner.query(`SELECT is_admin FROM users WHERE user_id = $1`, [user_id]);
            const is_admin = users[0] ? users[0].is_admin : false;

            if (post.user_id !== user_id && !is_admin) {
                await queryRunner.query('ROLLBACK');
                return res.status(403).json({ error: 'Forbidden: Not your post and not admin' });
            }

            await queryRunner.query(`DELETE FROM posts WHERE post_id = $1`, [id]);

            // Zatwierdzenie transakcji
            await queryRunner.query('COMMIT');
            res.json({ message: 'Post deleted successfully' });
        } catch (error) {
            // Wycofanie transakcji
            await queryRunner.query('ROLLBACK');
            res.status(500).json({ error: (error as Error).message });
        } finally {
            await queryRunner.release();
        }
    },

    getFeed: async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.userId);
            if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });

            const postRepository = getRepository(Post, 'main');
            const sql = `
          SELECT p.post_id, p.content, p.created_at,
            u.username AS author_username,
            up."avatarUrl" AS author_avatar,
            COUNT(DISTINCT l.like_id) AS like_count,
            COUNT(DISTINCT c.comment_id) AS comment_count,
            (CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END) AS is_followed
          FROM posts p
          INNER JOIN users u ON p.user_id = u.user_id
          INNER JOIN user_profile up ON u.user_id = up."userId"
          LEFT JOIN follows f ON f.followed_id = u.user_id AND f.follower_id = $1
          LEFT JOIN likes l ON p.post_id = l.post_id
          LEFT JOIN comments c ON p.post_id = c.post_id
          GROUP BY p.post_id, p.content, p.created_at, u.user_id, u.username, up."avatarUrl", f.follower_id
          ORDER BY is_followed DESC, like_count DESC, p.created_at DESC
          LIMIT 20;`;

            const feed = await postRepository.query(sql, [userId]);
            res.json(feed);
        } catch (error) {
            res.status(500).json({ error: (error as Error).message });
        }
    }
};
