# Mikkel's Agent Skills

<p align="center">
  <img src="assets/banner.gif" alt="Agent Skills" width="640">
</p>

A curated collection of agent skills that give your AI agent direct access to live data through purpose-built CLIs. Framework agnostic — works with any agent that supports skills.

Contributions are welcome!

## Available Skills

### Danish Job Search

**jobindex-search** — Search live job listings from [Jobindex.dk](https://jobindex.dk) — Denmark's largest job portal

```bash
npx skills add https://github.com/mikkelkrogsholm/skills --skill jobindex-search
```

**jobnet-search** — Search job listings from [Jobnet.dk](https://jobnet.dk) — the public employment service

```bash
npx skills add https://github.com/mikkelkrogsholm/skills --skill jobnet-search
```

**jobdanmark-search** — Search job listings from [Jobdanmark.dk](https://jobdanmark.dk)

```bash
npx skills add https://github.com/mikkelkrogsholm/skills --skill jobdanmark-search
```

**jobbank-search** — Search job listings from [Akademikernes Jobbank](https://jobbank.dk) — portal for highly educated candidates

```bash
npx skills add https://github.com/mikkelkrogsholm/skills --skill jobbank-search
```

### Danish Property Market

**boliga** — Property data from [Boliga.dk](https://boliga.dk) — sales history, listings, and price statistics

```bash
npx skills add https://github.com/mikkelkrogsholm/skills --skill boliga
```

**boligsiden** — Property data from [Boligsiden.dk](https://boligsiden.dk) — listings, sales, and market stats

```bash
npx skills add https://github.com/mikkelkrogsholm/skills --skill boligsiden
```

### Biomedical Research

**pubmed-database** — Search 35M+ citations from PubMed/MEDLINE via the NCBI E-utilities API

```bash
npx skills add https://github.com/mikkelkrogsholm/skills --skill pubmed-database
```

**medrxiv-search** — Search medical preprints from medRxiv across 51 subject categories

```bash
npx skills add https://github.com/mikkelkrogsholm/skills --skill medrxiv-search
```

## Want a New Skill?

Check the [open issues](https://github.com/mikkelkrogsholm/skills/issues?q=is%3Aissue+label%3A%22new+skill%22) to see what's planned, in progress, or up for grabs. Feel free to open a new issue to suggest a data source!

## Requirements

- [Bun](https://bun.sh) runtime
- An AI agent framework that supports skills

## License

MIT
