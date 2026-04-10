import { MODULE_ID } from "./constants.ts";

class Settings {
    // Settings keys
    #PERMISSION_LEVEL = "permissionLevel";

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
            onChange: (_value: string) => {
                for (const token of canvas.tokens.placeables) {
                    token.drawEffects();
                }
            }
        });
    }

    get permissionLevel(): string {
        return game.settings.get(MODULE_ID, this.#PERMISSION_LEVEL) as unknown as string;
    }
}

export { Settings };
