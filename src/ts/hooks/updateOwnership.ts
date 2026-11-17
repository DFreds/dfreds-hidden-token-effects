import { redrawEffects } from "../redraw-effects.ts";
import { Listener } from "./index.ts";

const UpdateOwnership: Listener = {
    listen(): void {
        for (const hook of ["updateActor", "updateItem"]) {
            Hooks.on(hook, (_document: unknown, changes: object) => {
                if ("ownership" in changes) redrawEffects();
            });
        }
    },
};

export { UpdateOwnership };
