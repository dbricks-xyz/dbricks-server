import e from "express";

export abstract class CommonRoutesConfig {
    app: e.Application;
    name: string;

    protected constructor(app: e.Application, name: string,) {
        this.app = app;
        this.name = name;
    }
    getName() {
        return this.name;
    }
    abstract configureRoutes(): e.Application;
}