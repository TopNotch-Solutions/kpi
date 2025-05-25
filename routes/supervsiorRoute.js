const {Router} = require('express');
const supervisorController = require('../controllers/supervisorController');
const supervisorRouter = Router();

supervisorRouter.get('/all-users', supervisorController.allUsers);  
supervisorRouter.get('/all-marshalls', supervisorController.allMarshalls);
supervisorRouter.get('/all-supervisors', supervisorController.allSupervisors);
supervisorRouter.get('/all-admins', supervisorController.allAdmins);
supervisorRouter.get('/all-devices', supervisorController.allDevices);
supervisorRouter.post('/my-marshall',  supervisorController.myMarshalls); 

module.exports = supervisorRouter;