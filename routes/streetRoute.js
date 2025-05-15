const {Router} = require('express');
const streetController = require('../controllers/streetController');
const streetRouter = Router();

streetRouter.post('/create', streetController.create);  
streetRouter.get('/all-street', streetController.allStreet);
streetRouter.put('/single', streetController.update);
streetRouter.delete('/single', streetController.delete);

module.exports = streetRouter;