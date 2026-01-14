// Mock data reflecting the structure of data after enrichment
const mockHabit = {
    color: "#FF5733",
    metadata: {
        visuals: { color: "#FF5733" },
        compiler: { step: "Do x", why: "Because y" }
    }
};

const enrichedData = [mockHabit].map((h: any) => ({
    ...h,
    metadata: {
        ...h.metadata,
        hex_color: h.color || h.metadata?.visuals?.color || '#3B82F6',
        identity: h.metadata?.identity || h.metadata?.compiler?.why || 'Default Why',
        tactical: h.metadata?.tactical || h.metadata?.compiler?.step || 'Default Step'
    }
}));

console.log("Verifying Lore Payload Structure...");
const habit = enrichedData[0];
if (habit.metadata.hex_color === "#FF5733" && habit.metadata.tactical === "Do x" && habit.metadata.identity === "Because y") {
    console.log("✅ Lore Payload Verified: hex_color, tactical, and identity are present.");
} else {
    console.error("❌ Lore Payload Mismatch:", habit.metadata);
    process.exit(1);
}

// Mock Profile logic
const mockProfile = {
    role: 'ROOT_ADMIN',
    callsign: 'Maverick',
    display_name: 'Pete Mitchell',
    full_name: 'Pete Maverick Mitchell'
};

// Logic check
const dbRole = mockProfile.role;
const finalRole = (dbRole === 'ROOT_ADMIN' || dbRole === 'admin') ? dbRole : 'user';

if (finalRole === 'ROOT_ADMIN') {
     console.log("✅ Admin Logic Verified: ROOT_ADMIN preserved.");
} else {
     console.error("❌ Admin Logic Failed: Expected ROOT_ADMIN, got", finalRole);
     process.exit(1);
}
