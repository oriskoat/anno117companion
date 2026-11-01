'use strict';
const communityMore=morePage;
let communityExpanded=false;
const coffeeIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm12 1h2a3 3 0 0 1 0 6h-2M7 3v2m4-2v2M2 22h18"/></svg>';
morePage=function(){return communityPage()+communityMore();};
function communityPage(){return `<section id="community" class="card community-page"><div class="community-top"><details class="community-details" ${communityExpanded?'open':''} ontoggle="if(this.isConnected)communityExpanded=this.open"><summary><h2>About me & Support</h2>${svg('chevron')}</summary><div class="community-columns">${donationStory()}${aboutStory()}</div></details>${donationLink()}</div></section>`;}

function donationLink(){return `<a class="primary donation-link" href="https://revolut.me/vafvyop?currency=EUR&amp;amount=500" target="_blank" rel="noopener noreferrer" onclick="return openDonationLink()">${coffeeIcon}<span>Buy me a coffee</span>${svg('arrow')}</a>`;}
function openDonationLink(){
 if(typeof window.Native?.openDonation==='function'){window.Native.openDonation();return false;}
 if(window.desktopMode&&window.pywebview?.api?.open_donation){window.pywebview.api.open_donation();return false;}
 return true;
}
function donationStory(){return `<div class="community-story"><div class="community-mark">${coffeeIcon}</div><div class="kicker">SUPPORT THE COMPANION</div><h2>Even governors need coffee. ☕️</h2><p class="story-lead">Rome wasn't built in a day. This Companion almost was.</p><p>I built it because I'd rather spend my time building an empire than digging through statistics.</p><p>If it makes ruling yours a little easier, feel free to buy me a coffee. Or treat my dog to some Bird Tongues in Aspic. 🐾</p><p class="story-emphasis">No tribute required. The Empire is yours to enjoy.</p><p class="donation-destination">Opens Revolut in your browser · revolut.me/vafvyop</p></div>`;}
function aboutStory(){return `<div class="community-story"><div class="community-mark">${svg('home')}</div><div class="kicker">BEHIND THE COMPANION</div><h2>About me</h2><p class="story-lead">Hey, I'm Ádám, a gamer from Hungary and the proud owner of a dachshund with IVDD.</p><p>I have a habit of looking at things and thinking, "There has to be a better way to do this." And sometimes, instead of just complaining about it, I end up building something myself.</p><p>That's pretty much how this Companion was born.</p><p>I love the complexity of Anno, but I'd rather spend my time building cities, managing trade, and expanding my empire than constantly digging through statistics menus.</p><p>So I spent an afternoon doing something about it. And here we are.</p><p>I'm sharing it for free because I think other players might enjoy it too.</p><p>Every coffee helps fuel the next round of ideas, experiments, and probably a few late-night coding sessions.</p><p>And my next idea? Creating an Albion-inspired Pannonian region.</p><p>That might take a little more than just a few coffees, but oh, that would be so much fun!</p><p class="story-emphasis">For now, enjoy the Companion, and may your empire prosper!</p></div>`;}

function openAboutMe(){communityExpanded=true;nav('more');$('community')?.scrollIntoView?.({block:'start'});}
function openDonationPage(){openAboutMe();}
