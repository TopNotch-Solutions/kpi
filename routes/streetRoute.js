const {Router} = require('express');
const streetController = require('../controllers/streetController');
const streetRouter = Router();

streetRouter.post('/create', streetController.create);  
streetRouter.get('/all-street', streetController.allStreet);
streetRouter.get('/all-active', streetController.active);
streetRouter.get('/all-inactive', streetController.inactive);
streetRouter.get('/all-under-maintenance', streetController.underMaintenance);
streetRouter.get('/single/:id', streetController.single);
streetRouter.put('/single', streetController.update);
streetRouter.put('/change-status', streetController.changeStatus);
streetRouter.delete('/single', streetController.delete);

module.exports = streetRouter;