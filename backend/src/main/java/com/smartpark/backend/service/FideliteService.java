package com.smartpark.backend.service;

import com.smartpark.backend.dto.FideliteResponseDTO;
import com.smartpark.backend.model.Abonnement;
import com.smartpark.backend.model.Fidelite;
import com.smartpark.backend.repository.AbonnementRepository;
import com.smartpark.backend.repository.FideliteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class FideliteService {

    @Autowired
    private FideliteRepository fideliteRepository;

    @Autowired
    private AbonnementRepository abonnementRepository;

    @Autowired
    private EmailService emailService;

    // ════════════════════════════════════════
    // CONFIG NIVEAUX
    // ════════════════════════════════════════
    private static final int POINTS_SILVER   = 100;
    private static final int POINTS_GOLD     = 300;
    private static final int POINTS_PLATINUM = 700;

    // Points gagnés par action
    private static final int POINTS_PAR_MATCH       = 10;
    private static final int POINTS_PAR_RESERVATION = 5;
    private static final int POINTS_BONUS_CARTE      = 50;

    // Réductions par niveau (%)
    private static final double REDUC_SILVER   = 5.0;
    private static final double REDUC_GOLD     = 10.0;
    private static final double REDUC_PLATINUM = 15.0;

    // ════════════════════════════════════════
    // ✅ Obtenir ou créer le profil fidélité
    // ════════════════════════════════════════
    public Fidelite getOuCreer(
            String email, String nom) {
        return fideliteRepository
                .findByEmail(email)
                .orElseGet(() -> {
                    Fidelite f = new Fidelite();
                    f.setEmail(email);
                    f.setNomClient(nom);
                    f.setPointsTotal(0);
                    f.setPointsDisponibles(0);
                    f.setPointsUtilises(0);
                    f.setNiveau("BRONZE");
                    f.setMatchsJoues(0);
                    f.setMatchsCarteActuelle(0);
                    f.setCartesCompletes(0);
                    f.setEconomiesTotal(0.0);
                    f.setCreatedAt(now());
                    f.setLastActivity(now());
                    return fideliteRepository.save(f);
                });
    }

    // ════════════════════════════════════════
    // ✅ Ajouter des points après un match
    // ════════════════════════════════════════
    public FideliteResponseDTO ajouterPointsMatch(
            String email, String nom,
            String titreMatch) {

        Fidelite f = getOuCreer(email, nom);

        // +10 points par match
        ajouterPoints(f, POINTS_PAR_MATCH,
                "Match joué : " + titreMatch, "MATCH");

        // Incrémenter carte 10 matchs
        f.setMatchsJoues(f.getMatchsJoues() + 1);
        f.setMatchsCarteActuelle(
                f.getMatchsCarteActuelle() + 1);

        boolean carteComplete = false;

        // ✅ Carte complète → bonus + récompense
        if (f.getMatchsCarteActuelle() >= 10) {
            f.setCartesCompletes(
                    f.getCartesCompletes() + 1);
            f.setMatchsCarteActuelle(0); // reset

            // Bonus 50 points
            ajouterPoints(f, POINTS_BONUS_CARTE,
                    "🎉 Carte 10 matchs complétée !",
                    "BONUS");
            carteComplete = true;
        }

        // Mettre à jour le niveau
        mettreAJourNiveau(f);
        f.setLastActivity(now());

        Fidelite saved = fideliteRepository.save(f);

        // ✅ Email carte complète
        if (carteComplete) {
            try {
                emailService.envoyerCarteComplete(
                        email, nom,
                        f.getCartesCompletes(),
                        f.getPointsDisponibles());
            } catch (Exception e) {
                System.err.println(
                        "Email carte ignoré: "
                                + e.getMessage());
            }
        }

        return toDTO(saved);
    }

    // ════════════════════════════════════════
    // ✅ Ajouter des points après réservation
    // ════════════════════════════════════════
    public FideliteResponseDTO ajouterPointsReservation(
            String email, String nom,
            double montant, String terrainNom) {

        Fidelite f = getOuCreer(email, nom);

        // +5 points par réservation
        // +1 point par tranche de 10 DT
        int bonusMontant = (int)(montant / 10);
        int totalPoints  =
                POINTS_PAR_RESERVATION + bonusMontant;

        ajouterPoints(f, totalPoints,
                "Réservation : " + terrainNom
                        + " (" + montant + " DT)",
                "RESERVATION");

        mettreAJourNiveau(f);
        f.setLastActivity(now());

        return toDTO(fideliteRepository.save(f));
    }

    // ════════════════════════════════════════
    // ✅ Utiliser des points (réduction)
    // ════════════════════════════════════════
    public Map<String, Object> utiliserPoints(
            String email, String nom,
            int pointsAUtiliser,
            double montantOriginal) {

        Fidelite f = getOuCreer(email, nom);

        if (f.getPointsDisponibles()
                < pointsAUtiliser) {
            throw new RuntimeException(
                    "Points insuffisants ! Vous avez "
                            + f.getPointsDisponibles()
                            + " points disponibles.");
        }

        // 1 point = 0.1 DT de réduction
        double reduction =
                pointsAUtiliser * 0.1;
        double montantFinal =
                Math.max(0, montantOriginal - reduction);

        f.setPointsDisponibles(
                f.getPointsDisponibles() - pointsAUtiliser);
        f.setPointsUtilises(
                f.getPointsUtilises() + pointsAUtiliser);
        f.setEconomiesTotal(
                f.getEconomiesTotal() + reduction);

        // Log dans historique
        Fidelite.HistoriquePoint h =
                new Fidelite.HistoriquePoint();
        h.setDate(now());
        h.setType("UTILISE");
        h.setPoints(-pointsAUtiliser);
        h.setDescription("Réduction de "
                + reduction + " DT utilisée");
        h.setSource("REDUCTION");
        f.getHistorique().add(0, h);

        fideliteRepository.save(f);

        Map<String, Object> result = new HashMap<>();
        result.put("pointsUtilises",  pointsAUtiliser);
        result.put("reduction",       reduction);
        result.put("montantOriginal", montantOriginal);
        result.put("montantFinal",    montantFinal);
        result.put("pointsRestants",
                f.getPointsDisponibles());
        return result;
    }

    // ════════════════════════════════════════
    // ✅ Calculer réduction selon niveau
    // ════════════════════════════════════════
    public Map<String, Object> calculerReduction(
            String email, double montant) {

        Optional<Fidelite> optF =
                fideliteRepository.findByEmail(email);

        if (optF.isEmpty()) {
            return Map.of(
                    "reduction", 0.0,
                    "montantFinal", montant,
                    "niveau", "BRONZE",
                    "reductionPct", 0.0);
        }

        Fidelite f = optF.get();
        double pct = getReductionPct(f.getNiveau());

        // Vérifier abonnement actif
        Optional<Abonnement> abonnement =
                abonnementRepository
                        .findByEmailAndActif(email, true);

        if (abonnement.isPresent()) {
            Abonnement ab = abonnement.get();
            // Prendre la meilleure réduction
            pct = Math.max(pct, ab.getReductionPct());
        }

        double reduction  = montant * pct / 100;
        double montantFinal =
                Math.max(0, montant - reduction);

        return Map.of(
                "reduction",    reduction,
                "montantFinal", montantFinal,
                "niveau",       f.getNiveau(),
                "reductionPct", pct,
                "points",       f.getPointsDisponibles());
    }

    // ════════════════════════════════════════
    // ✅ Souscrire à un abonnement
    // ════════════════════════════════════════
    public Abonnement souscrireAbonnement(
            String email, String nom,
            String type) {

        // Désactiver l'abonnement actif
        abonnementRepository
                .findByEmailAndActif(email, true)
                .ifPresent(ab -> {
                    ab.setActif(false);
                    abonnementRepository.save(ab);
                });

        Abonnement ab = new Abonnement();
        ab.setEmail(email);
        ab.setNomClient(nom);
        ab.setType(type);
        ab.setActif(true);
        ab.setDateDebut(
                LocalDate.now().toString());
        ab.setDateFin(
                LocalDate.now()
                        .plusMonths(1).toString());
        ab.setCreatedAt(now());

        // Config selon type
        switch (type.toUpperCase()) {
            case "BASIC":
                ab.setMatchsTotal(5);
                ab.setMatchsRestants(5);
                ab.setReductionPct(5.0);
                ab.setPointsBonus(20);
                ab.setPrixPaye(29.0);
                break;
            case "PREMIUM":
                ab.setMatchsTotal(10);
                ab.setMatchsRestants(10);
                ab.setReductionPct(15.0);
                ab.setPointsBonus(50);
                ab.setPrixPaye(49.0);
                break;
            case "VIP":
                ab.setMatchsTotal(20);
                ab.setMatchsRestants(20);
                ab.setReductionPct(25.0);
                ab.setPointsBonus(100);
                ab.setPrixPaye(79.0);
                break;
            default:
                throw new RuntimeException(
                        "Type d'abonnement invalide !");
        }

        Abonnement saved =
                abonnementRepository.save(ab);

        // Bonus points pour souscription
        Fidelite f = getOuCreer(email, nom);
        ajouterPoints(f, ab.getPointsBonus(),
                "🎁 Bonus abonnement " + type,
                "BONUS");
        mettreAJourNiveau(f);
        fideliteRepository.save(f);

        // ✅ Email confirmation abonnement
        try {
            emailService.envoyerConfirmationAbonnement(
                    email, nom, type,
                    ab.getDateDebut(),
                    ab.getDateFin(),
                    ab.getMatchsTotal(),
                    ab.getReductionPct(),
                    ab.getPrixPaye());
        } catch (Exception e) {
            System.err.println(
                    "Email abonnement ignoré: "
                            + e.getMessage());
        }

        return saved;
    }

    // ════════════════════════════════════════
    // ✅ Obtenir le profil fidélité complet
    // ════════════════════════════════════════
    public FideliteResponseDTO getProfil(
            String email) {
        Fidelite f = fideliteRepository
                .findByEmail(email)
                .orElse(null);

        if (f == null) {
            return FideliteResponseDTO.builder()
                    .email(email)
                    .niveau("BRONZE")
                    .niveauIcon("🥉")
                    .pointsTotal(0)
                    .pointsDisponibles(0)
                    .matchsJoues(0)
                    .matchsCarteActuelle(0)
                    .cartesCompletes(0)
                    .matchsRestantsCarte(10)
                    .prochainMatchGratuit(false)
                    .economiesTotal(0.0)
                    .build();
        }

        return toDTO(f);
    }

    // ════════════════════════════════════════
    // ✅ Classement fidélité (leaderboard)
    // ════════════════════════════════════════
    public List<Map<String, Object>> getLeaderboard() {
        List<Fidelite> tous =
                fideliteRepository.findAll();

        tous.sort((a, b) ->
                Integer.compare(
                        b.getPointsTotal(),
                        a.getPointsTotal()));

        List<Map<String, Object>> result =
                new ArrayList<>();
        int rank = 1;

        for (Fidelite f : tous
                .subList(0, Math.min(10, tous.size()))) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("rank",    rank++);
            entry.put("nom",     f.getNomClient());
            entry.put("points",  f.getPointsTotal());
            entry.put("niveau",  f.getNiveau());
            entry.put("icon",    getNiveauIcon(
                    f.getNiveau()));
            entry.put("matchs",  f.getMatchsJoues());
            result.add(entry);
        }

        return result;
    }

    // ════════════════════════════════════════
    // ✅ Stats admin
    // ════════════════════════════════════════
    public Map<String, Object> getStatsAdmin() {
        List<Fidelite> tous =
                fideliteRepository.findAll();
        List<Abonnement> abonnements =
                abonnementRepository.findAll();

        long bronze   = tous.stream()
                .filter(f -> "BRONZE"
                        .equals(f.getNiveau())).count();
        long silver   = tous.stream()
                .filter(f -> "SILVER"
                        .equals(f.getNiveau())).count();
        long gold     = tous.stream()
                .filter(f -> "GOLD"
                        .equals(f.getNiveau())).count();
        long platinum = tous.stream()
                .filter(f -> "PLATINUM"
                        .equals(f.getNiveau())).count();
        long abActifs = abonnements.stream()
                .filter(Abonnement::isActif).count();

        int totalPoints = tous.stream()
                .mapToInt(Fidelite::getPointsTotal)
                .sum();
        double totalEconomies = tous.stream()
                .mapToDouble(Fidelite::getEconomiesTotal)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalClients",    tous.size());
        stats.put("bronze",          bronze);
        stats.put("silver",          silver);
        stats.put("gold",            gold);
        stats.put("platinum",        platinum);
        stats.put("abonnementsActifs", abActifs);
        stats.put("totalPoints",     totalPoints);
        stats.put("totalEconomies",  totalEconomies);
        return stats;
    }

    // ════════════════════════════════════════
    // MÉTHODES PRIVÉES
    // ════════════════════════════════════════

    private void ajouterPoints(
            Fidelite f, int points,
            String description, String source) {
        f.setPointsTotal(
                f.getPointsTotal() + points);
        f.setPointsDisponibles(
                f.getPointsDisponibles() + points);

        Fidelite.HistoriquePoint h =
                new Fidelite.HistoriquePoint();
        h.setDate(now());
        h.setType("GAIN");
        h.setPoints(points);
        h.setDescription(description);
        h.setSource(source);
        f.getHistorique().add(0, h);

        // Garder seulement les 50 derniers
        if (f.getHistorique().size() > 50) {
            f.setHistorique(
                    f.getHistorique()
                            .subList(0, 50));
        }
    }

    private void mettreAJourNiveau(Fidelite f) {
        int pts = f.getPointsTotal();
        String ancienNiveau = f.getNiveau();
        String nouveauNiveau;

        if      (pts >= POINTS_PLATINUM)
            nouveauNiveau = "PLATINUM";
        else if (pts >= POINTS_GOLD)
            nouveauNiveau = "GOLD";
        else if (pts >= POINTS_SILVER)
            nouveauNiveau = "SILVER";
        else
            nouveauNiveau = "BRONZE";

        f.setNiveau(nouveauNiveau);

        // Email si montée de niveau
        if (!nouveauNiveau.equals(ancienNiveau)) {
            try {
                emailService.envoyerMonteeNiveau(
                        f.getEmail(),
                        f.getNomClient(),
                        ancienNiveau,
                        nouveauNiveau,
                        getReductionPct(nouveauNiveau));
            } catch (Exception e) {
                System.err.println(
                        "Email niveau ignoré: "
                                + e.getMessage());
            }
        }
    }

    private double getReductionPct(String niveau) {
        switch (niveau) {
            case "SILVER":   return REDUC_SILVER;
            case "GOLD":     return REDUC_GOLD;
            case "PLATINUM": return REDUC_PLATINUM;
            default:         return 0.0;
        }
    }

    private String getNiveauIcon(String niveau) {
        switch (niveau) {
            case "SILVER":   return "🥈";
            case "GOLD":     return "🥇";
            case "PLATINUM": return "💎";
            default:         return "🥉";
        }
    }

    private FideliteResponseDTO toDTO(Fidelite f) {
        int ptsProchaineNiveau =
                getPointsProchainNiveau(
                        f.getNiveau(), f.getPointsTotal());
        int progression =
                getProgressionNiveau(
                        f.getNiveau(), f.getPointsTotal());
        int matchsRestantsCarte =
                10 - f.getMatchsCarteActuelle();
        boolean prochainGratuit =
                f.getMatchsCarteActuelle() == 9;

        // Abonnement actif
        FideliteResponseDTO.AbonnementDTO abDTO = null;
        Optional<Abonnement> ab =
                abonnementRepository
                        .findByEmailAndActif(
                                f.getEmail(), true);
        if (ab.isPresent()) {
            Abonnement a = ab.get();
            abDTO = FideliteResponseDTO
                    .AbonnementDTO.builder()
                    .type(a.getType())
                    .typeLabel(getLabelAbonnement(
                            a.getType()))
                    .dateFin(a.getDateFin())
                    .matchsRestants(a.getMatchsRestants())
                    .reductionPct(a.getReductionPct())
                    .actif(a.isActif())
                    .build();
        }

        return FideliteResponseDTO.builder()
                .id(f.getId())
                .email(f.getEmail())
                .nomClient(f.getNomClient())
                .pointsTotal(f.getPointsTotal())
                .pointsDisponibles(
                        f.getPointsDisponibles())
                .pointsUtilises(f.getPointsUtilises())
                .niveau(f.getNiveau())
                .niveauIcon(getNiveauIcon(f.getNiveau()))
                .pointsProchainNiveau(ptsProchaineNiveau)
                .progressionNiveau(progression)
                .matchsJoues(f.getMatchsJoues())
                .matchsCarteActuelle(
                        f.getMatchsCarteActuelle())
                .cartesCompletes(f.getCartesCompletes())
                .matchsRestantsCarte(matchsRestantsCarte)
                .prochainMatchGratuit(prochainGratuit)
                .economiesTotal(f.getEconomiesTotal())
                .createdAt(f.getCreatedAt())
                .lastActivity(f.getLastActivity())
                .historique(f.getHistorique())
                .abonnementActif(abDTO)
                .build();
    }

    private int getPointsProchainNiveau(
            String niveau, int pts) {
        switch (niveau) {
            case "BRONZE":   return POINTS_SILVER  - pts;
            case "SILVER":   return POINTS_GOLD    - pts;
            case "GOLD":     return POINTS_PLATINUM - pts;
            default:         return 0;
        }
    }

    private int getProgressionNiveau(
            String niveau, int pts) {
        switch (niveau) {
            case "BRONZE":
                return Math.min(100,
                        pts * 100 / POINTS_SILVER);
            case "SILVER":
                return Math.min(100,
                        (pts - POINTS_SILVER) * 100
                                / (POINTS_GOLD - POINTS_SILVER));
            case "GOLD":
                return Math.min(100,
                        (pts - POINTS_GOLD) * 100
                                / (POINTS_PLATINUM - POINTS_GOLD));
            default:
                return 100;
        }
    }

    private String getLabelAbonnement(String type) {
        switch (type) {
            case "BASIC":   return "⭐ Basic";
            case "PREMIUM": return "🌟 Premium";
            case "VIP":     return "💎 VIP";
            default:        return type;
        }
    }

    private String now() {
        return LocalDateTime.now().format(
                DateTimeFormatter.ofPattern(
                        "yyyy-MM-dd HH:mm"));
    }
}