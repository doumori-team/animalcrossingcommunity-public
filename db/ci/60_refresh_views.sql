UPDATE site_setting
SET updated = (SELECT updated - interval '1 day' FROM site_setting WHERE id = 4)
WHERE id = 5;

REFRESH MATERIALIZED VIEW top_bell_latest;
REFRESH MATERIALIZED VIEW top_bell_last_jackpot;
REFRESH MATERIALIZED VIEW top_bell_search;

REFRESH MATERIALIZED VIEW archived_threads;