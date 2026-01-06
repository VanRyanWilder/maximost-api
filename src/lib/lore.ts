export const D_A_S_H_LORE = `MaxiMost Philosophy: We do not use 'Willpower' (a finite battery). We train 'Internal Force' (a forged muscle). The core system is D.A.S.H: Day (Current Focus), Atom (Smallest Unit), Step (Immediate Action), Habit (Permanent Code). We practice the 'Shopping Cart Rule' (Integrity when no one is watching). We calibrate the Biological Base (Sleep, Sunlight, Diet) before allowing supplements. The Dashboard is Offense (The Saber); the Toolbelt is Defense (The Armor).`;

export async function getLore(): Promise<string> {
    // In the future, this can be swapped to fetch from a database
    return D_A_S_H_LORE;
}
