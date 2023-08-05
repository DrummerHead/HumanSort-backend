# Shared

This folder has code shared between backend and frontend.

It is manually synced by running:

```
npm run sync
```

Which just copies over the folder from backend to frontend assuming the two projects being siblings.

This means that any changes to the contents of these files should be performed in the backend shared folder, since changes in the frontend one will be overwritten.
