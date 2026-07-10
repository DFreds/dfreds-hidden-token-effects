import type Token from "@client/canvas/placeables/token.d.mts";
import { libWrapper } from "@static/lib/shim.ts";
import { MODULE_ID } from "../constants.ts";
import { Listener } from "./index.ts";
import { HiddenTokenEffects } from "../hidden-token-effects.ts";
import CombatTracker from "@client/applications/sidebar/tabs/combat-tracker.mjs";

const Setup: Listener = {
    listen(): void {
        Hooks.once("setup", () => {
            if (BUILD_MODE === "development") {
                CONFIG.debug.hooks = true;
            }

            libWrapper.register(
                MODULE_ID,
                "foundry.canvas.placeables.Token.prototype._drawEffects",
                drawEffectsWrapper,
                "OVERRIDE",
            );

            libWrapper.register(
                MODULE_ID,
                "ActiveEffect.prototype._displayScrollingStatus",
                displayScrollingStatusWrapper,
                "MIXED",
            );

            libWrapper.register(
                MODULE_ID,
                "foundry.applications.sidebar.tabs.CombatTracker.prototype._prepareTurnContext",
                prepareTurnContextWrapper,
                "OVERRIDE",
            );
        });
    },
};

async function drawEffectsWrapper(this: Token) {
    this.effects.renderable = false;

    // Clear Effects Container
    this.effects.removeChildren().forEach((c) => c.destroy());
    // @ts-expect-error this is defined
    this.effects.bg = this.effects.addChild(new PIXI.Graphics());
    // @ts-expect-error this is defined
    this.effects.bg.zIndex = -1;
    // @ts-expect-error this is defined
    this.effects.overlay = null;

    // Categorize effects
    const SHOW_ICON = CONST.ACTIVE_EFFECT_SHOW_ICON;
    const activeEffects =
        this.actor?.appliedEffects.filter(
            (e) => e.showIcon === SHOW_ICON.ALWAYS || (e.showIcon === SHOW_ICON.CONDITIONAL && e.isTemporary),
        ) ?? [];
    const overlayEffect = activeEffects.findLast((e: any) => e.flags.core?.overlay);

    // Draw effects
    const promises = [];
    for (const [i, effect] of activeEffects.entries()) {
        /* Added Code Start */
        const hiddenTokenEffects = new HiddenTokenEffects();
        if (!(await hiddenTokenEffects.shouldShowEffect(effect)) && effect !== overlayEffect) {
            continue;
        }

        if (!effect.img) continue;
        /* Added Code End */

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

async function displayScrollingStatusWrapper(
    this: ActiveEffect<any>,
    wrapped: (enabled: boolean) => void,
    enabled: boolean,
) {
    const hiddenTokenEffects = new HiddenTokenEffects();

    if (await hiddenTokenEffects.shouldShowEffect(this)) {
        wrapped(enabled);
        return;
    }
}

async function prepareTurnContextWrapper(this: CombatTracker, combat: Combat, combatant: Combatant, index: number) {
    const { id, name, isOwner, isDefeated, hidden, initiative, permission } = combatant;
    const resource = permission >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ? combatant.resource : null;
    const hasDecimals = Number.isFinite(initiative) && !Number.isInteger(initiative);
    const turn = {
        hasDecimals,
        hidden,
        id,
        isDefeated,
        initiative,
        isOwner,
        name,
        resource,
        active: index === combat.turn,
        canPing: combatant.sceneId === canvas.scene?.id && game.user.hasPermission("PING_CANVAS"),
        img: await this._getCombatantThumbnail(combatant),
    };
    // @ts-expect-error this is fine to define
    turn.css = [turn.active ? "active" : null, hidden ? "hide" : null, isDefeated ? "defeated" : null].filterJoin(" ");
    const effects = [];
    const SHOW_ICON = CONST.ACTIVE_EFFECT_SHOW_ICON;
    for (const effect of combatant.actor?.appliedEffects ?? []) {
        const hiddenTokenEffects = new HiddenTokenEffects();

        if (effect.statuses.has(CONFIG.specialStatusEffects.DEFEATED)) {
            turn.isDefeated = true;
        } else if (!(await hiddenTokenEffects.shouldShowEffect(effect))) {
            /* Added Code Start */
            // no-op - just do nothing here
        } else if (
            /* Added Code End */
            effect.showIcon === SHOW_ICON.ALWAYS ||
            (effect.showIcon === SHOW_ICON.CONDITIONAL && effect.isTemporary)
        ) {
            effects.push({ img: effect.img, name: effect.name });
        }
    }
    // @ts-expect-error From foundry
    turn.effects = {
        icons: effects,
        // @ts-expect-error From foundry
        tooltip: this._formatEffectsTooltip(effects),
    };
    return turn;
}

export { Setup };
