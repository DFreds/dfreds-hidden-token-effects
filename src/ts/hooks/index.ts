import { HotReload } from "./hot-reload.ts";
import { Init } from "./init.ts";
import { Setup } from "./setup.ts";
import { UpdateOwnership } from "./updateOwnership.ts";

interface Listener {
    listen(): void;
}

const HooksHiddenTokenEffects: Listener = {
    listen(): void {
        const listeners: Listener[] = [HotReload, Init, Setup, UpdateOwnership];

        for (const listener of listeners) {
            listener.listen();
        }
    },
};

export { HooksHiddenTokenEffects };
export type { Listener };
