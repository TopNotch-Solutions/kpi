const {Router} = require('express');
const authController = require('../controllers/authController');
const authRouter = Router();

authRouter.post('/sign-up', authController.signup);  
authRouter.post('/login', authController.login);
authRouter.post('/forgot-password', authController.forgotPassword);
authRouter.put('/change-password', authController.changePassword);
authRouter.put('/newPassword',  authController.newPassword)
authRouter.put('/update/details', authController.details); 
authRouter.put('/update/user/details/:userId', authController.detailsUser); 
authRouter.delete('/delete', authController.delete); 

module.exports = authRouter;