import type Token from "@client/canvas/placeables/token.d.mts";
import { libWrapper } from "@static/lib/shim.ts";
import { MODULE_ID } from "../constants.ts";
import { Listener } from "./index.ts";
import { Settings } from "../settings.ts";
import { DocumentOwnershipLevel } from "@common/constants.mjs";

const Setup: Listener = {
    listen(): void {
        Hooks.once("setup", () => {
            if (BUILD_MODE === "development") {
                CONFIG.debug.hooks = true;
            }

            libWrapper.register(
                MODULE_ID,
                "Token.prototype._drawEffects",
                drawEffectsWrapper,
                "OVERRIDE",
            );
        });
    },
};

async function drawEffectsWrapper(this: Token, _wrapped: () => void) {
    this.effects.renderable = false;

    // Clear Effects Container
    this.effects.removeChildren().forEach((c) => c.destroy());
    // @ts-ignore
    this.effects.bg = this.effects.addChild(new PIXI.Graphics());
    // @ts-ignore
    this.effects.bg.zIndex = -1;
    // @ts-ignore
    this.effects.overlay = null;

    // Categorize effects
    const activeEffects = this.actor?.temporaryEffects || [];
    const overlayEffect = activeEffects.findLast(
        (e) => e.img && e.getFlag("core", "overlay"),
    );

    const hiddenTokenEffects = new HiddenTokenEffects();

    // Draw effects
    const promises = [];
    for (const [i, effect] of activeEffects.entries()) {
        if (!effect.img) continue;

        // Added code
        if (!(await hiddenTokenEffects.shouldShowEffect(effect))) {
            continue;
        }

        const promise =
            effect === overlayEffect
                ? this._drawOverlay(effect.img, effect.tint)
                : this._drawEffect(effect.img, effect.tint);
        promises.push(
            promise.then((e) => {
                if (e) e.zIndex = i;
            }),
        );
    }
    await Promise.allSettled(promises);

    this.effects.sortChildren();
    this.effects.renderable = true;
    this.renderFlags.set({ refreshEffects: true });
}

class HiddenTokenEffects {
    #settings: Settings;

    constructor() {
        this.#settings = new Settings();
    }

    async shouldShowEffect(effect: ActiveEffect<any>): Promise<boolean> {
        if (game.user.isGM) return true;

        const isOriginOwner = await this.#isOriginOwner(effect);
        const isPermissionAllowed = this.#isPermissionAllowed(effect);
        return isOriginOwner || isPermissionAllowed;
    }

    async #isOriginOwner(effect: ActiveEffect<any>): Promise<boolean> {
        if (!effect.origin) return false;

        const originDocument = await fromUuid(effect.origin);
        return originDocument?.isOwner ?? false;
    }

    #isPermissionAllowed(effect: ActiveEffect<any>): boolean {
        const permissionLevel = this.#settings.permissionLevel;

        return effect.testUserPermission(
            game.user,
            permissionLevel as unknown as DocumentOwnershipLevel,
        );
    }
}

export { Setup };
