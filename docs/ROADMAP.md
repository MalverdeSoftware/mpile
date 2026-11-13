# Roadmap

## Working in 0.1

- Text cards, typed in or imported from a CSV, and one activity: each participant sorts the same set of cards on their own
- Optionally, each participant adds cards of their own in answer to a prompt and sorts them with the shared cards
- A personal link and six-digit passcode for each participant, with saved drafts and one final submission
- Participant-defined piles, optional explanations, and unsorted cards
- Responses sealed in the participant's browser, which only the researcher's key file can open; the site stores sealed data and deletes it when the session is deleted or expires
- A researcher console that runs on the researcher's own computer: create a session, follow progress, add or remove participants, collect, close and delete
- CSV and JSON exports, a co-sorting matrix, a circular connection map, and average-linkage clustering
- Local development and a standalone Cloudflare deployment setup

## Next

- Pilot with synthetic data and a small group of community members and researchers
- If it is asked for, design the collect-review-sort activity described in [methods](METHODS.md): contribution review and a record of where each card came from. It is not planned for now
- Decide whether participants need to correct or withdraw a submission afterward
- Add key rotation and recovery
- Add optional verified invitation tokens and deployment-level abuse controls for large public use
- Try collaborative live sorting as its own mode, clearly separate from independent responses
- Try researcher-reviewed category crosswalks and optional multidimensional scaling, with documented stress diagnostics
- Try a multilingual interface, offline facilitation, images and audio, and more accessibility testing

None of the items under Next are in the current app.
