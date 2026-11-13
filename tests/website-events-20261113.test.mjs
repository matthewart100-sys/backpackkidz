import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = path => readFileSync(new URL('../BackPackKidzWebsite/' + path, import.meta.url), 'utf8');
test('upcoming events have verified dates and distinct sponsor and attendance links', () => {
 const s=read('pages/future-events.html');
 for(const text of ['Holidays with the Horses','December 12','January 9, 2027','February 27, 2027','holiday-with-the-horses','riverwood-golf-outing-sponsorships-benefiting-the-back-pack-kidz','PGICA.org/Beyond_Ourselves','become-a-sponsor-or-donor-for-the-home-tour-share-the-love-for-the-kids','67321609-2026']) assert.ok(s.includes(text),text);
 assert.doesNotMatch(s,/href="https:\/\/ticketstripe.com\/lifeofriley2026"/);
 assert.doesNotMatch(s,/No other public dates|only public date on the calendar|schema.org\/InStock/);
 assert.equal((s.replace(/<!--[\s\S]*?-->/g, "").match(/<h1\b/g)||[]).length,1);
});
test('donate offers Zeffy and Events while retaining PayPal and optional details',()=> {
 const s=read('pages/donate.html');
 assert.ok(s.includes('donate-to-change-lives-28985'));
 assert.match(s,/>Events<\/a>/);
 assert.ok(s.includes('optional') && s.includes('$0') && s.includes('frequency'));
 assert.ok(s.includes('hosted_button_id=VSXH3DH6PUFH2'));
 assert.ok(s.includes('data-donation-form novalidate'));
});
test('every non-governed page with a footer offers the verified Facebook profile',()=>{
 const pages=['index.html','pages/about.html','pages/programs.html','pages/sponsor.html','pages/gallery.html','pages/contact.html','pages/get-involved.html','pages/donate.html','pages/faq.html','pages/future-events.html','pages/board-of-directors.html'];
 for(const page of pages) assert.ok(read(page).replace(/<!--[\s\S]*?-->/g,'').includes('https://www.facebook.com/TheBackPackKidz/'),page);
});
