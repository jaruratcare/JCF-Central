import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import sprintsRouter from "./sprints";
import itemsRouter from "./items";
import commentsRouter from "./comments";
import membersRouter from "./members";
import departmentsRouter from "./departments";
import rolesRouter from "./roles";
import usersRouter from "./users";
import { requireUser, requireTechOrCeo } from "./middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireUser);
router.use(requireTechOrCeo);
router.use(departmentsRouter);
router.use(rolesRouter);
router.use(usersRouter);
router.use(projectsRouter);
router.use(membersRouter);
router.use(sprintsRouter);
router.use(itemsRouter);
router.use(commentsRouter);

export default router;
