"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.get('/stats', userController_1.getUserStats);
router.get('/activity', userController_1.getUserActivity);
router.get('/notifications', userController_1.getNotifications);
router.put('/notifications/:id/read', userController_1.markNotificationRead);
router.get('/inbox', userController_1.getInbox);
router.get('/tasks', userController_1.getTasks);
router.post('/tasks', userController_1.createTask);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map