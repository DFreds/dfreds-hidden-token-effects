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

    const hiddenTokenEffects = new HiddenTokenEffects(this);

    // Draw effects
    const promises = [];
    for (const [i, effect] of activeEffects.entries()) {
        if (!effect.img) continue;

        // Added code
        if (!(await hiddenTokenEffects.shouldShowEffect(effect))) {
            continue;
        }
        // setting for friendly tokens should show
        // CONST.TOKEN_DISPOSITIONS
        /**
       * {
    "SECRET": -2,
    "HOSTILE": -1,
    "NEUTRAL": 0,
    "FRIENDLY": 1
}
       */
        // otherwise, check ownership
        // also check origin ownership
        // otherwise, check setting for allowed levels

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
    #token: Token;
    #settings: Settings;

    constructor(token: Token) {
        this.#token = token;
        this.#settings = new Settings();
    }

    async shouldShowEffect(effect: ActiveEffect<any>): Promise<boolean> {
        if (game.user.isGM) return true;

        const isOriginOwner = await this.#isOriginOwner(effect);
        const isTokenDispositionAllowed = this.#isTokenDispositionAllowed();
        const isPermissionAllowed = this.#isPermissionAllowed(effect);

        return (
            isOriginOwner || isTokenDispositionAllowed || isPermissionAllowed
        );
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

    #isTokenDispositionAllowed(): boolean {
        const tokenDocument = this.#token.document;
        const disposition = tokenDocument.disposition;
        const dispositionLevel = this.#settings.dispositionLevel;

        if (dispositionLevel === "DISABLED") return false;

        if (
            dispositionLevel === "FRIENDLY_ONLY" &&
            disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY
        ) {
            return true;
        }
        if (
            dispositionLevel === "FRIENDLY_AND_NEUTRAL" &&
            (disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY ||
                disposition === CONST.TOKEN_DISPOSITIONS.NEUTRAL)
        ) {
            return true;
        }

        return false;
    }
}

export { Setup };
