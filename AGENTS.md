# Architecture rules
- Client tracking uses unguessable per-service links and a server-side response with explicit fields and temporary photo URLs; never make service records publicly readable.
- Store signatures, feedback and technical fields as JSON objects, while normalizing legacy JSON strings when reading.
- Signature capture opens in a viewport-filling dialog; store trimmed PNG evidence so saved signatures remain legible.
- Photo annotations save a separate evidence image through the existing photo upload flow, preserving the original photo.
