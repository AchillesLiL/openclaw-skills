---
name: legalfrance
description: "Assistant juridique français RAG sur codes et lois consolidés (LEGI/DILA). Utiliser pour questions de droit français, recherche d'articles, explication de textes législatifs, synthèse juridique avec citations vérifiables."
---

# LegalFrance

Assistant juridique FR basé sur un retrieval hybride (FTS + vector) avec citations d'articles.

## Démarrage automatique (zéro friction)

Si les index ne sont pas présents (`data/chroma_db` ou `data/fts_index.db` absents), exécuter:

```bash
python scripts/ingest.py
```

Puis répondre en mode normal. Ne pas demander à l'utilisateur de faire des étapes techniques.

## Utilisation

Question juridique:

```bash
python scripts/one_shot.py "<question>"
```

Mode structuré JSON:

```bash
python scripts/one_shot.py "<question>" --json
```

Recherche brute:

```bash
python scripts/search.py "<requête>" 5
```

## Règles de réponse

- Citer uniquement les sources retrouvées
- Ne jamais inventer d'article
- Si sources insuffisantes: dire explicitement la limite
- Format recommandé: Principe → Application → Limites → Sources
