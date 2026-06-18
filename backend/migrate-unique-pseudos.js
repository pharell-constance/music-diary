/**
 * migrate-unique-pseudos.js
 * Assure que tous les pseudos de la base de données sont uniques (insensible à la casse),
 * met à jour les utilisateurs modifiés et envoie une notification système à chacun.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("⏳ Récupération de tous les utilisateurs...");
    const users = await prisma.user.findMany({
        select: {
            id: true,
            pseudo: true,
            email: true
        }
    });

    console.log(`✅ ${users.length} utilisateurs trouvés.`);

    const seenPseudos = new Set();
    const updatedUsers = [];

    console.log("⏳ Analyse des pseudos et résolution des doublons...");
    for (const user of users) {
        let originalPseudo = (user.pseudo || "").trim();
        if (!originalPseudo) {
            originalPseudo = `user_${user.id}`;
        }

        let pseudo = originalPseudo;
        let counter = 2;

        // Résolution de doublon insensible à la casse
        while (seenPseudos.has(pseudo.toLowerCase())) {
            pseudo = `${originalPseudo}_${counter}`;
            counter++;
        }

        // Enregistrer dans l'ensemble des pseudos déjà pris
        seenPseudos.add(pseudo.toLowerCase());

        // Si le pseudo a changé, on doit le mettre à jour dans la base
        if (pseudo !== user.pseudo) {
            updatedUsers.push({
                id: user.id,
                oldPseudo: user.pseudo,
                newPseudo: pseudo
            });
        } else {
            // Pour garder la trace du pseudo final de chaque utilisateur (pour les notifs)
            user.finalPseudo = pseudo;
        }
    }

    console.log(`💡 Nombre de pseudos à mettre à jour : ${updatedUsers.length}`);

    // Exécuter les mises à jour des pseudos en base
    if (updatedUsers.length > 0) {
        console.log("⏳ Mise à jour des pseudos modifiés en base...");
        for (const item of updatedUsers) {
            await prisma.user.update({
                where: { id: item.id },
                data: { pseudo: item.newPseudo }
            });
            // Assigner le pseudo final pour la génération de la notification
            const u = users.find(usr => usr.id === item.id);
            if (u) u.finalPseudo = item.newPseudo;
        }
        console.log("✅ Pseudos mis à jour.");
    }

    // Créer des notifications pour tous les utilisateurs
    console.log("⏳ Préparation des notifications pour tous les utilisateurs...");
    const notificationsData = users.map(user => {
        const finalPseudo = user.finalPseudo || user.pseudo;
        return {
            userId: user.id,
            type: "SYSTEM",
            content: `Changement important : votre adresse email a été supprimée de Music Diary. Pour vous connecter, vous devez désormais utiliser votre pseudo unique : ${finalPseudo}`
        };
    });

    // Insertion des notifications par lots de 1000 pour éviter les surcharges/timeouts
    const BATCH_SIZE = 1000;
    console.log(`⏳ Insertion de ${notificationsData.length} notifications en base par lots de ${BATCH_SIZE}...`);
    for (let i = 0; i < notificationsData.length; i += BATCH_SIZE) {
        const batch = notificationsData.slice(i, i + BATCH_SIZE);
        await prisma.notification.createMany({
            data: batch
        });
        console.log(`  → ${Math.min(i + BATCH_SIZE, notificationsData.length)} / ${notificationsData.length} notifications insérées`);
    }

    console.log("🎉 Migration terminée avec succès !");
}

main()
    .catch(err => {
        console.error("❌ Erreur lors de la migration :", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
