# Full Digiteka migration as first-class documents

The ~680 WP "project" posts that are digitised archival records migrate into Sanity as `archiveItem` documents grouped under `collection`, with metadata as label/value pairs (key sets differ per collection — charters carry 8 descriptors, letters none). Their scans are NOT in the WP REST dump (NextGEN renders a placeholder); a dedicated scrape pass fetches each live `/project/` page to extract full-resolution gallery URLs from `/wp-content/blogs.dir/4271/files/<slug>/` and the breadcrumb → collection mapping.

Considered: deferring Digiteka to phase 2, or linking out to external portals — rejected because the digitised records are the site's most unique content and "phase 2" plans tend not to happen.
