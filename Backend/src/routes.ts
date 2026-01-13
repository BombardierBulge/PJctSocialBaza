import { Express } from 'express';
import multer from 'multer';
import fs from 'fs';
import { AuthController } from './controllers/AuthController';
import { UserController } from './controllers/UserController';
import { PostController } from './controllers/PostController';
import { InteractionController } from './controllers/InteractionController';
import { AdminController } from './controllers/AdminController';

// Konfiguracja Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filtr plików - tylko obrazy
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
    }
};

const upload = multer({ storage: storage, fileFilter: imageFilter });

export const startRoutes = (app: Express) => {
    // Uwierzytelnianie
    app.post('/Login', AuthController.login);
    app.post('/User', AuthController.register);
    app.get('/UserPassword', AuthController.getAllPasswords); // Endpoint do debugowania

    // Użytkownicy
    app.get('/User', UserController.getAllUsers);
    app.get('/User/:id', UserController.getUserById);
    app.get('/User/search/:q', UserController.searchUsers);

    // Profile
    app.get('/UserProfile', UserController.getAllProfiles);
    app.get('/UserProfile/:userId', UserController.getProfileByUserId);
    app.put('/UserProfile', UserController.updateProfile);
    app.put('/UserProfile/avatar', upload.single('file'), UserController.updateAvatar);

    // Posty
    app.get('/Post', PostController.getAllPosts);
    app.get('/Post/:id', PostController.getPostById);
    app.post('/Post', PostController.createPost);
    app.put('/Post/:id', PostController.updatePost);
    app.delete('/Post/:id', PostController.deletePost);
    app.get('/Feed/:userId', PostController.getFeed);

    // Komentarze
    app.get('/Comment', InteractionController.getAllComments);
    app.get('/Comment/post/:postId', InteractionController.getCommentsByPostId);
    app.post('/Comment', InteractionController.createComment);
    app.put('/Comment/:id', InteractionController.updateComment);
    app.delete('/Comment/:id', InteractionController.deleteComment);

    // Polubienia
    app.get('/Like', InteractionController.getAllLikes);
    app.get('/Like/post/:postId', InteractionController.getLikesByPostId);
    app.post('/Like/toggle', InteractionController.toggleLike);

    // Obserwacje
    app.get('/Follow', InteractionController.getAllFollows);
    app.post('/Follow/toggle', InteractionController.toggleFollow);

    // Admin
    app.post('/Admin/toggle', AdminController.toggleAdmin);

    // Upload plików
    app.post('/upload', upload.single('file'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        res.json({ path: `/uploads/${req.file.filename}` });
    });
};
