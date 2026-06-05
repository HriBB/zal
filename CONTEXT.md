# ZAL Website

Public website of Zgodovinski arhiv Ljubljana (Historical Archives of Ljubljana), a Slovenian public institution with five regional branches. Content is Slovenian; code identifiers are English.

## Language

**Page**:
An editorial content page whose body is an ordered list of Blocks. Pages nest via a parent Page; a Page's URL is its parent chain (`/parent/child`).
_Avoid_: article, static page

**Block**:
One composable section of a Page body. Four kinds: rich text, gallery, table, embed.
_Avoid_: section, module, widget

**Post** (novica):
A dated news entry — announcement, event, or exhibition. Belongs to one or more Categories.
_Avoid_: news item, blog post

**Category**:
Editorial grouping of Posts. Exactly four: *arhivalija meseca*, *dogodki in obvestila*, *obvestila*, *razstave*.
_Avoid_: tag, rubric

**Arhivalija meseca**:
Monthly featured-archival-item article series. A Post in the *arhivalija meseca* Category, not a separate type.

**Archive unit** (enota):
One of the five physical branches of ZAL: Ljubljana, Kranj (Gorenjska), Novo mesto (Dolenjska in Bela krajina), Škofja Loka, Idrija. Holds address, contacts, office and reading-room hours.
_Avoid_: branch, location, department

**Collection** (zbirka):
A Digiteka grouping of digitised Archive items (e.g. *Listine iz Zbirke listin*, *Popisi prebivalstva*).
_Avoid_: album, set

**Archive item** (arhivalija):
A single digitised record — charter, census sheet, letter — belonging to exactly one Collection. Carries label/value metadata pairs and scan images.
_Avoid_: project (the WP legacy name), record, artifact

**Digiteka**:
The digital-collections section of the site: all Collections and their Archive items.

**Site settings**:
Singleton holding navigation, footer, social links, and external-archive links.

**Home page**:
Singleton holding the authored hero and service cards. News grid, unit strip, and arhivalija-meseca band are auto-fed by queries, not authored.

**Scan**:
A full-resolution photographed page/image of an Archive item, displayed in the item gallery.
_Avoid_: thumbnail (thumbnails are derived, never stored)
