function redrawEffects(): void {
    for (const token of canvas.tokens.placeables) {
        token.drawEffects();
    }
    ui.combat.render();
}

export { redrawEffects };
