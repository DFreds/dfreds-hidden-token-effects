import { DocumentOwnershipLevel } from "@common/constants.mjs";
import { Settings } from "./settings.ts";

class HiddenTokenEffects {
    shouldShowEffect(effect: ActiveEffect<any>): boolean {
        if (game.user.isGM) return true;

        const isOriginOwner = this.#isOriginOwner(effect);
        const isPermissionAllowed = this.#isPermissionAllowed(effect);
        return isOriginOwner || isPermissionAllowed;
    }

    #isOriginOwner(effect: ActiveEffect<any>): boolean {
        if (!effect.origin) return false;

        const origin = fromUuidSync(effect.origin, { strict: false });
        return origin instanceof foundry.abstract.Document && origin.isOwner;
    }

    #isPermissionAllowed(effect: ActiveEffect<any>): boolean {
        const settings = new Settings();
        const permissionLevel = settings.permissionLevel;
        if (permissionLevel === "DISABLED") return true;

        return effect.testUserPermission(game.user, permissionLevel as unknown as DocumentOwnershipLevel);
    }
}

export { HiddenTokenEffects };
