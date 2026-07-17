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
router.use("/api", departmentsRouter);
router.use("/api", rolesRouter);
router.use("/api", usersRouter);
router.use("/api", projectsRouter);
router.use("/api", membersRouter);
router.use("/api", sprintsRouter);
router.use("/api", itemsRouter);
router.use("/api", commentsRouter);

export default router;
