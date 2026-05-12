package com.smartpark.backend.service;

import com.smartpark.backend.dto.MatchRequestDTO;
import com.smartpark.backend.dto.MatchResponseDTO;
import com.smartpark.backend.model.Match;
import com.smartpark.backend.repository.MatchRepository;
import com.smartpark.backend.repository.TerrainRepository;
import com.smartpark.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchService {

    @Autowired private MatchRepository   matchRepository;
    @Autowired private TerrainRepository terrainRepository;
    @Autowired private EmailService      emailService;
    @Autowired private UserRepository    userRepository;

    // ════════════════════════════════════════════
    // ✅ Convertir Match → DTO
    // ════════════════════════════════════════════
    private MatchResponseDTO toDTO(
            Match m, String emailUser) {

        List<String> joueurs =
                m.getJoueurs() != null
                        ? m.getJoueurs() : new ArrayList<>();

        List<String> attente =
                m.getListeAttente() != null
                        ? m.getListeAttente() : new ArrayList<>();

        boolean estInscrit   = joueurs.contains(emailUser);
        boolean estCreateur  = emailUser != null
                && emailUser.equals(m.getCreateurId());
        boolean estEnAttente = attente.contains(emailUser);

        int places = m.getNbJoueursMax()
                - m.getNbJoueursActuel();

        int position = 0;
        if (estEnAttente) {
            position = attente.indexOf(emailUser) + 1;
        }

        return MatchResponseDTO.builder()
                .id(m.getId())
                .titre(m.getTitre())
                .sport(m.getSport())
                .format(m.getFormat())
                .niveau(m.getNiveau())
                .description(m.getDescription())
                .terrainId(m.getTerrainId())
                .terrainNom(m.getTerrainNom())
                .date(m.getDate())
                .heure(m.getHeure())
                .nbJoueursMax(m.getNbJoueursMax())
                .nbJoueursActuel(m.getNbJoueursActuel())
                .placesRestantes(Math.max(0, places))
                .createurId(m.getCreateurId())
                .createurNom(m.getCreateurNom())
                .joueurs(joueurs)
                .listeAttente(attente)
                .nbAttente(attente.size())
                .positionAttente(position)
                .statut(m.getStatut())
                .createdAt(m.getCreatedAt())
                .estInscrit(estInscrit)
                .estCreateur(estCreateur)
                .estEnAttente(estEnAttente)
                .build();
    }

    // ════════════════════════════════════════════
    // ✅ Helper — Nom depuis email
    // ════════════════════════════════════════════
    private String getNomFromEmail(String email) {
        return userRepository.findByEmail(email)
                .map(u -> u.getNom() != null
                        && !u.getNom().isBlank()
                        ? u.getNom()
                        : email.split("@")[0])
                .orElse(email.split("@")[0]);
    }

    // ════════════════════════════════════════════
    // ✅ Terrain nom safe
    // ════════════════════════════════════════════
    private String getTerrainNomSafe(Match m) {
        return m.getTerrainNom() != null
                && !m.getTerrainNom().isBlank()
                ? m.getTerrainNom() : "À confirmer";
    }

    // ════════════════════════════════════════════
    // ✅ CRÉER un match
    // ════════════════════════════════════════════
    public MatchResponseDTO creerMatch(
            MatchRequestDTO dto,
            String emailCreateur,
            String nomCreateur) {

        Match match = new Match();
        match.setTitre(dto.getTitre());
        match.setSport(dto.getSport());
        match.setFormat(dto.getFormat());
        match.setNiveau(dto.getNiveau());
        match.setDescription(dto.getDescription());
        match.setDate(dto.getDate());
        match.setHeure(dto.getHeure());
        match.setNbJoueursMax(dto.getNbJoueursMax());
        match.setNbJoueursActuel(1);
        match.setCreateurId(emailCreateur);
        match.setCreateurNom(nomCreateur);
        match.setStatut("OUVERT");
        match.setCreatedAt(
                LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern(
                                "yyyy-MM-dd HH:mm")));

        match.getJoueurs().add(emailCreateur);

        if (dto.getTerrainId() != null
                && !dto.getTerrainId().isBlank()) {
            terrainRepository
                    .findById(dto.getTerrainId())
                    .ifPresent(t -> {
                        match.setTerrainId(t.getId());
                        match.setTerrainNom(t.getNom());
                    });
        }

        Match saved = matchRepository.save(match);

        // ✅ EMAIL — Confirmation création au créateur
        try {
            emailService.envoyerConfirmationInscription(
                    emailCreateur,
                    nomCreateur,
                    saved.getTitre(),
                    saved.getSport(),
                    saved.getDate(),
                    saved.getHeure(),
                    getTerrainNomSafe(saved),
                    saved.getFormat());
        } catch (Exception e) {
            System.err.println(
                    "Email création ignoré: "
                            + e.getMessage());
        }

        return toDTO(saved, emailCreateur);
    }

    // ════════════════════════════════════════════
    // ✅ MATCHS OUVERTS + COMPLETS
    // ════════════════════════════════════════════
    public List<MatchResponseDTO> getMatchsOuverts(
            String emailUser) {
        return matchRepository.findAll()
                .stream()
                .filter(m ->
                        "OUVERT".equals(m.getStatut())
                                || "COMPLET".equals(m.getStatut()))
                .map(m -> toDTO(m, emailUser))
                .sorted((a, b) ->
                        b.getCreatedAt().compareTo(
                                a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════
    // ✅ TOUS LES MATCHS (admin)
    // ════════════════════════════════════════════
    public List<MatchResponseDTO> getAllMatchs(
            String emailUser) {
        return matchRepository.findAll()
                .stream()
                .map(m -> toDTO(m, emailUser))
                .sorted((a, b) ->
                        b.getCreatedAt().compareTo(
                                a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════
    // ✅ MES MATCHS (inscrit OU en attente)
    // ════════════════════════════════════════════
    public List<MatchResponseDTO> getMesMatchs(
            String email) {
        return matchRepository.findAll()
                .stream()
                .filter(m -> {
                    boolean inscrit =
                            m.getJoueurs() != null
                                    && m.getJoueurs().contains(email);
                    boolean attente =
                            m.getListeAttente() != null
                                    && m.getListeAttente()
                                    .contains(email);
                    return inscrit || attente;
                })
                .map(m -> toDTO(m, email))
                .sorted((a, b) ->
                        b.getCreatedAt().compareTo(
                                a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    // ════════════════════════════════════════════
    // ✅ REJOINDRE un match
    // Place dispo → inscription directe
    // Match complet → liste d'attente
    // ════════════════════════════════════════════
    public MatchResponseDTO rejoindreMatch(
            String matchId,
            String email,
            String nom) {

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() ->
                        new RuntimeException("Match introuvable"));

        // ─── Vérifications
        if ("ANNULE".equals(match.getStatut())) {
            throw new RuntimeException(
                    "Ce match est annulé !");
        }

        if (match.getJoueurs() != null
                && match.getJoueurs().contains(email)) {
            throw new RuntimeException(
                    "Vous êtes déjà inscrit !");
        }

        if (match.getListeAttente() != null
                && match.getListeAttente()
                .contains(email)) {
            throw new RuntimeException(
                    "Vous êtes déjà en liste d'attente !");
        }

        // ─── CAS 1 : place disponible
        if (match.getNbJoueursActuel()
                < match.getNbJoueursMax()) {

            match.getJoueurs().add(email);
            match.setNbJoueursActuel(
                    match.getJoueurs().size());

            boolean devientComplet =
                    match.getNbJoueursActuel()
                            >= match.getNbJoueursMax();

            if (devientComplet) {
                match.setStatut("COMPLET");
            }

            Match saved = matchRepository.save(match);

            // ✅ EMAIL 1 — Confirmation au joueur
            try {
                emailService
                        .envoyerConfirmationInscription(
                                email, nom,
                                saved.getTitre(),
                                saved.getSport(),
                                saved.getDate(),
                                saved.getHeure(),
                                getTerrainNomSafe(saved),
                                saved.getFormat());
            } catch (Exception e) {
                System.err.println(
                        "Email confirmation ignoré: "
                                + e.getMessage());
            }

            // ✅ EMAIL 2 — Match complet à TOUS
            if (devientComplet) {
                for (String joueurEmail
                        : saved.getJoueurs()) {
                    try {
                        String nomJoueur =
                                getNomFromEmail(joueurEmail);
                        emailService.envoyerMatchComplet(
                                joueurEmail, nomJoueur,
                                saved.getTitre(),
                                saved.getSport(),
                                saved.getDate(),
                                saved.getHeure(),
                                saved.getNbJoueursActuel());
                    } catch (Exception e) {
                        System.err.println(
                                "Email complet ignoré pour "
                                        + joueurEmail + ": "
                                        + e.getMessage());
                    }
                }
            }

            return toDTO(saved, email);
        }

        // ─── CAS 2 : match complet → liste d'attente
        if (match.getListeAttente() == null) {
            match.setListeAttente(new ArrayList<>());
        }
        match.getListeAttente().add(email);

        Match saved = matchRepository.save(match);
        int position = saved.getListeAttente()
                .indexOf(email) + 1;

        // ✅ EMAIL 3 — Inscription liste d'attente
        try {
            emailService.envoyerInscriptionAttente(
                    email, nom,
                    saved.getTitre(),
                    saved.getSport(),
                    saved.getDate(),
                    saved.getHeure(),
                    position);
        } catch (Exception e) {
            System.err.println(
                    "Email attente ignoré: "
                            + e.getMessage());
        }

        return toDTO(saved, email);
    }

    // ════════════════════════════════════════════
    // ✅ QUITTER un match
    // Joueur part → 1er en attente prend sa place
    // ════════════════════════════════════════════
    public MatchResponseDTO quitterMatch(
            String matchId, String email) {

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() ->
                        new RuntimeException("Match introuvable"));

        // ─── CAS 1 : quitter la liste d'attente
        if (match.getListeAttente() != null
                && match.getListeAttente()
                .contains(email)) {
            match.getListeAttente().remove(email);
            return toDTO(
                    matchRepository.save(match), email);
        }

        // ─── CAS 2 : quitter les joueurs confirmés
        if (!match.getJoueurs().contains(email)) {
            throw new RuntimeException(
                    "Vous n'êtes pas inscrit !");
        }

        if (email.equals(match.getCreateurId())) {
            throw new RuntimeException(
                    "Le créateur ne peut pas quitter. "
                            + "Annulez le match !");
        }

        // Retirer le joueur
        match.getJoueurs().remove(email);
        match.setNbJoueursActuel(
                match.getJoueurs().size());

        // ✅ Transfert automatique liste d'attente
        if (match.getListeAttente() != null
                && !match.getListeAttente().isEmpty()) {

            String premierEnAttente =
                    match.getListeAttente().get(0);
            match.getListeAttente().remove(0);
            match.getJoueurs().add(premierEnAttente);
            match.setNbJoueursActuel(
                    match.getJoueurs().size());

            System.out.println(
                    "✅ " + premierEnAttente
                            + " a rejoint automatiquement : "
                            + match.getTitre());

            // ✅ EMAIL 4 — Place disponible au 1er
            try {
                String nomPromu =
                        getNomFromEmail(premierEnAttente);
                emailService.envoyerPlaceDisponible(
                        premierEnAttente, nomPromu,
                        match.getTitre(),
                        match.getSport(),
                        match.getDate(),
                        match.getHeure(), 1);
            } catch (Exception e) {
                System.err.println(
                        "Email place dispo ignoré: "
                                + e.getMessage());
            }

            // ✅ Mettre à jour positions attente restants
            // (2ème devient 1er, etc.)
            List<String> attenteRestante =
                    match.getListeAttente();
            for (int i = 0;
                 i < attenteRestante.size(); i++) {
                String emailAttente =
                        attenteRestante.get(i);
                int nouvellePosition = i + 1;
                // Email seulement si position change
                // significativement (1er ou 2ème)
                if (nouvellePosition <= 2) {
                    try {
                        String nomAttente =
                                getNomFromEmail(
                                        emailAttente);
                        emailService
                                .envoyerMisAJourPosition(
                                        emailAttente,
                                        nomAttente,
                                        match.getTitre(),
                                        match.getSport(),
                                        match.getDate(),
                                        match.getHeure(),
                                        nouvellePosition);
                    } catch (Exception e) {
                        System.err.println(
                                "Email position ignoré: "
                                        + e.getMessage());
                    }
                }
            }
        }

        // Remettre OUVERT si plus complet
        if ("COMPLET".equals(match.getStatut())
                && match.getNbJoueursActuel()
                < match.getNbJoueursMax()) {
            match.setStatut("OUVERT");
        }

        return toDTO(matchRepository.save(match), email);
    }

    // ════════════════════════════════════════════
    // ✅ ANNULER un match (créateur seulement)
    // ════════════════════════════════════════════
    public MatchResponseDTO annulerMatch(
            String matchId, String email) {

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() ->
                        new RuntimeException("Match introuvable"));

        if (!email.equals(match.getCreateurId())) {
            throw new RuntimeException(
                    "Seul le créateur peut annuler !");
        }

        match.setStatut("ANNULE");
        Match saved = matchRepository.save(match);

        // ✅ EMAIL 5 — Prévenir TOUS (joueurs + attente)
        // sauf le créateur lui-même
        List<String> tousConcernes = new ArrayList<>();

        if (saved.getJoueurs() != null) {
            tousConcernes.addAll(saved.getJoueurs());
        }
        if (saved.getListeAttente() != null) {
            tousConcernes.addAll(
                    saved.getListeAttente());
        }

        for (String joueurEmail : tousConcernes) {
            // Ne pas envoyer au créateur
            if (joueurEmail.equals(email)) continue;

            try {
                String nom = getNomFromEmail(
                        joueurEmail);
                emailService.envoyerMatchAnnule(
                        joueurEmail, nom,
                        saved.getTitre(),
                        saved.getSport(),
                        saved.getDate(),
                        saved.getHeure());
            } catch (Exception e) {
                System.err.println(
                        "Email annulation ignoré pour "
                                + joueurEmail + ": "
                                + e.getMessage());
            }
        }

        return toDTO(saved, email);
    }

    // ════════════════════════════════════════════
    // ✅ QUITTER liste d'attente explicitement
    // ════════════════════════════════════════════
    public MatchResponseDTO quitterListeAttente(
            String matchId, String email) {

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() ->
                        new RuntimeException("Match introuvable"));

        if (match.getListeAttente() == null
                || !match.getListeAttente()
                .contains(email)) {
            throw new RuntimeException(
                    "Vous n'êtes pas en liste d'attente !");
        }

        match.getListeAttente().remove(email);
        Match saved = matchRepository.save(match);

        // Mettre à jour positions des restants
        List<String> attenteRestante =
                saved.getListeAttente();
        for (int i = 0;
             i < attenteRestante.size(); i++) {
            String emailAttente = attenteRestante.get(i);
            int nouvellePosition = i + 1;
            if (nouvellePosition <= 3) {
                try {
                    String nom = getNomFromEmail(
                            emailAttente);
                    emailService
                            .envoyerMisAJourPosition(
                                    emailAttente, nom,
                                    saved.getTitre(),
                                    saved.getSport(),
                                    saved.getDate(),
                                    saved.getHeure(),
                                    nouvellePosition);
                } catch (Exception e) {
                    System.err.println(
                            "Email MAJ position ignoré: "
                                    + e.getMessage());
                }
            }
        }

        return toDTO(saved, email);
    }

    // ════════════════════════════════════════════
    // ✅ GET par ID
    // ════════════════════════════════════════════
    public MatchResponseDTO getById(
            String id, String email) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Match introuvable"));
        return toDTO(match, email);
    }

    // ════════════════════════════════════════════
    // ✅ STATS admin
    // ════════════════════════════════════════════
    public Map<String, Object> getStats() {
        List<Match> all = matchRepository.findAll();

        long ouverts  = all.stream()
                .filter(m -> "OUVERT".equals(m.getStatut()))
                .count();
        long complets = all.stream()
                .filter(m -> "COMPLET".equals(m.getStatut()))
                .count();
        long annules  = all.stream()
                .filter(m -> "ANNULE".equals(m.getStatut()))
                .count();
        int joueurs   = all.stream()
                .mapToInt(Match::getNbJoueursActuel)
                .sum();
        int enAttente = all.stream()
                .mapToInt(m ->
                        m.getListeAttente() != null
                                ? m.getListeAttente().size() : 0)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total",     all.size());
        stats.put("ouverts",   ouverts);
        stats.put("complets",  complets);
        stats.put("annules",   annules);
        stats.put("joueurs",   joueurs);
        stats.put("enAttente", enAttente);
        return stats;
    }
}