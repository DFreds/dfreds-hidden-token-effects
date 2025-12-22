import { MODULE_ID } from "./constants.ts";

class Settings {
    // Settings keys
    #PERMISSION_LEVEL = "permissionLevel";
    #DISPOSITION_LEVEL = "dispositionLevel";

    register(): void {
        game.settings.register(MODULE_ID, this.#PERMISSION_LEVEL, {
            name: "HiddenTokenEffects.Settings.PermissionLevel.Name",
            hint: "HiddenTokenEffects.Settings.PermissionLevel.Hint",
            scope: "world",
            config: true,
            default: "OWNER",
            type: String,
            choices: {
                DISABLED:
                    "HiddenTokenEffects.Settings.PermissionLevel.Choices.Disabled",
                NONE: "OWNERSHIP.NONE",
                LIMITED: "OWNERSHIP.LIMITED",
                OBSERVER: "OWNERSHIP.OBSERVER",
                OWNER: "OWNERSHIP.OWNER",
            },
        });

        game.settings.register(MODULE_ID, this.#DISPOSITION_LEVEL, {
            name: "HiddenTokenEffects.Settings.DispositionLevel.Name",
            hint: "HiddenTokenEffects.Settings.DispositionLevel.Hint",
            scope: "world",
            config: true,
            default: "DISABLED",
            type: String,
            choices: {
                DISABLED:
                    "HiddenTokenEffects.Settings.DispositionLevel.Choices.Disabled",
                FRIENDLY_AND_NEUTRAL:
                    "HiddenTokenEffects.Settings.DispositionLevel.Choices.FriendlyAndNeutral",
                FRIENDLY_ONLY:
                    "HiddenTokenEffects.Settings.DispositionLevel.Choices.FriendlyOnly",
            },
        });
    }

    get permissionLevel(): string {
        return game.settings.get(MODULE_ID, this.#PERMISSION_LEVEL) as string;
    }

    get dispositionLevel(): string {
        return game.settings.get(MODULE_ID, this.#DISPOSITION_LEVEL) as string;
    }
}

export { Settings };
