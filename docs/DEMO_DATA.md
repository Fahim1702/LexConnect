# Fictional demo data

Run `npm run seed:demo` from the project root with the development database configured. Production mode is rejected. The command adds missing records using stable demo IDs and preserves existing edits on reruns. It does not erase data or replace real accounts. Repeated demo labels have been removed from the interface; the footer identifies the site as an educational project. The seed upgrades only unchanged original starter text, preserving custom edits and existing URLs.

Included records:

- Arif Hasan, Mira Ahmed and Samira Rahman, with fictional professional information and a local illustrated avatar.
- Rafi Karim, Nila Akter and Imran Chowdhury, with reserved `.example.test` email addresses and no real phone numbers.
- Three consultations spanning pending, assigned and resolved states.
- Three published case studies, three articles, three categorized FAQs and one review.
- The starter legal services and FAQ, if missing.

These users have synthetic MongoDB identity references solely for displaying sample relationships. No Firebase accounts or passwords are created, and the backend still requires a valid Firebase ID token. To test sign-in, register separate real test accounts through LexConnect and onboard a lawyer from the admin page. Never reuse a demo profile as a real person's account.

Demo information is visible publicly where published. Remove or archive it before presenting the site as a real legal service. You can manage the records in the admin pages; seed reruns respect existing edits and archives. Do not copy this database into production with demo records still active.
