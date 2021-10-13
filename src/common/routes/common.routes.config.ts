import e from 'express';

export default abstract class CommonRoutesConfig {
  app: e.Application;

  name: string;

  protected constructor(app: e.Application, name: string) {
    this.app = app;
    this.name = name;
    this.configureRoutes();
  }

  getName() {
    return this.name;
  }

  abstract configureRoutes(): e.Application;
}
