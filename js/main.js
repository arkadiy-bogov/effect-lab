import { startRouter, setupScrollTop, setupMobileNav } from "./core/app.js";
import "./sections/photo.js";
import "./sections/utils.js";
import "./sections/audio.js";
import "./sections/video.js";

setupMobileNav();
setupScrollTop();
startRouter();
