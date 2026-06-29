/**
 * seed-followers.js
 * Crée 10 000 abonnés fictifs pour pharell
 * Usage : node seed-followers.js
 */

const prisma = require('./src/config/db');

const TARGET_PSEUDO = 'pharell';
const FOLLOWER_COUNT = 10000;
const BATCH_SIZE = 500; // insère par lots pour éviter les timeouts

async function main() {
    // 1. Récupérer l'utilisateur cible
    let target = await prisma.user.findUnique({ where: { pseudo: TARGET_PSEUDO } });
    if (!target) {
        // Fallback to first user in database
        const firstUser = await prisma.user.findFirst();
        if (!firstUser) {
            console.error(`❌ Aucun utilisateur trouvé en base de données. Créez d'abord un utilisateur.`);
            process.exit(1);
        }
        console.log(`ℹ️ Cible "${TARGET_PSEUDO}" introuvable, utilisation de l'utilisateur existant : ${firstUser.pseudo}`);
        target = firstUser;
    } else {
        console.log(`✅ Cible trouvée : ${target.pseudo} (id=${target.id})`);
    }

    // 2. Créer les utilisateurs fictifs par lots
    console.log(`\n⏳ Création de ${FOLLOWER_COUNT} abonnés fictifs...`);
    const createdIds = [];

    for (let batch = 0; batch < FOLLOWER_COUNT / BATCH_SIZE; batch++) {
        const users = await prisma.$transaction(
            Array.from({ length: BATCH_SIZE }, (_, i) => {
                const n = batch * BATCH_SIZE + i + 1;
                return prisma.user.create({
                    data: {
                        password: 'hashed_placeholder',
                        pseudo: `Fan_${n}_${Date.now()}`,
                    },
                    select: { id: true },
                });
            })
        );
        users.forEach(u => createdIds.push(u.id));
        process.stdout.write(`\r  → ${createdIds.length} / ${FOLLOWER_COUNT} utilisateurs créés`);
    }

    console.log('\n');

    // 3. Insérer les relations Follows par lots
    console.log(`⏳ Création des ${FOLLOWER_COUNT} relations "follows"...`);
    let inserted = 0;

    for (let i = 0; i < createdIds.length; i += BATCH_SIZE) {
        const slice = createdIds.slice(i, i + BATCH_SIZE);
        await prisma.follows.createMany({
            data: slice.map(followerId => ({
                followerId,
                followingId: target.id,
            }))
        });
        inserted += slice.length;
        process.stdout.write(`\r  → ${inserted} / ${FOLLOWER_COUNT} relations insérées`);
    }

    console.log('\n');
    console.log(`🎉 Terminé ! ${target.pseudo} a maintenant ${FOLLOWER_COUNT} nouveaux abonnés.`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
