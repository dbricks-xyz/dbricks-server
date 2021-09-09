import e from "express";
import {CommonRoutesConfig} from '../common/common.routes.config';
import UsersController from './controllers/users.controller';
import UsersMiddleware from './middleware/users.middleware';

export class UsersRoutes extends CommonRoutesConfig {
    constructor(app: e.Application) {
        super(app, 'UserRoutes');
        this.configureRoutes();
    }

    configureRoutes(): e.Application {
        this.app
            .route(`/users`)
            .get(UsersController.listUsers)
            .post(
                UsersMiddleware.validateRequiredUserBodyFields,
                UsersMiddleware.validateSameEmailDoesntExist,
                UsersController.createUser
            );

        //if the userId paramn is present, then run this middleware
        this.app.param(`userId`, UsersMiddleware.extractUserId);

        this.app
            .route(`/users/:userId`)
            .all(UsersMiddleware.validateUserExists) //this one will be run for all
            .get(UsersController.getUserById) //this only for get
            .delete(UsersController.removeUser); //only delete

        //here's an example of us having a single verb per route
        this.app.put(`/users/:userId`, [
            UsersMiddleware.validateRequiredUserBodyFields,
            UsersMiddleware.validateSameEmailBelongToSameUser,
            UsersController.put,
        ]);

        this.app.patch(`/users/:userId`, [
            UsersMiddleware.validatePatchEmail,
            UsersController.patch,
        ]);

        return this.app;
    }
}