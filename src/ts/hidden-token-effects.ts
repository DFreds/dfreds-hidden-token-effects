import { DocumentOwnershipLevel } from "@common/constants.mjs";
import { Settings } from "./settings.ts";

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
        if (permissionLevel === "DISABLED") return true;

        return effect.testUserPermission(
            game.user,
            permissionLevel as unknown as DocumentOwnershipLevel,
        );
    }
}

export { HiddenTokenEffects };
