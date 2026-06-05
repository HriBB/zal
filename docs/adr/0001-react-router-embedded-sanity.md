# React Router 7 + embedded Sanity Studio, single origin

One app serves both the website and Sanity Studio (route-split at `/studio`), built with React Router 7 framework mode + Vite. Single origin makes Presentation/visual editing work without CORS ceremony, one build, one deploy — the same shape as the proven reference projects (mojterapevt, letece-kele, slackalien). Cost: Studio ships in the same repo/deploy cadence as the site.
