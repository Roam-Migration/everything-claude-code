# ACF Field Mapping — Home Page

*Status: Complete — field group `group_gf_home` (ID 1458), all 12 fields populated on post ID 12*

---

## Content Available from Legacy Site

### Hero / Mission Statement
```
This web site has been set up to honour the sacrifices made by each and every one
of the 1131 men who were sent to defend Ambon during World War Two.
779 of whom made the ultimate sacrifice.
```

### Association Aims (from About_us.html)
```
Our association was founded by the veterans of Gull Force after the end of WW2.

Current aims:
- To provide an ongoing support network for Gull Force Veterans and their families.
- To provide avenues for community development and to raise the awareness of
  the events important to Gull Force.
- To provide material, practical and emotional support to the people of Ambon.
```

### Contact (Public)
- Email: gullforce@hotmail.com
- Postal: P.O. Box 233, Wendouree 3355

### Membership Info
- Membership fee: $35.00 (life, includes lapel pin, Australian residents only)
- Newsletter subscription: $20.00 for 2 years (posted, for those without email)

---

## Proposed ACF Mapping (pending field audit)

| ACF Field (expected)  | Type          | Content Source                         | Value |
|-----------------------|---------------|----------------------------------------|-------|
| `hero_heading`        | text          | Legacy index.html                      | "Gull Force 2/21st Battalion" |
| `hero_subheading`     | text          | Legacy index.html                      | "Honouring the 1,131 men who defended Ambon" |
| `hero_body`           | textarea      | Legacy index.html + About_us.html      | Mission statement text |
| `hero_image`          | image         | `images/2 21Bn group.jpg`              | Battalion group photo |
| `member_count`        | number        | Legacy index.html                      | 1131 |
| `casualty_count`      | number        | Legacy index.html                      | 779 |
| `association_aims`    | repeater/wysiwyg | About_us.html                       | 3 aims bullet points |
| `contact_email`       | text          | About_us.html                          | gullforce@hotmail.com |
| `contact_postal`      | textarea      | About_us.html                          | P.O. Box 233, Wendouree 3355 |
| `membership_fee`      | text          | About_us.html                          | $35.00 |
| `background_audio`    | file          | `audio/Last Post.mp3`                  | Optional — confirm with client |

---

## Candidate Hero Images (from `images/`)

Priority candidates for home page hero:
1. `2 21Bn group.jpg` — full battalion group
2. `Trawool 1940 A Coy.jpg` — A Company formation photo, Trawool
3. `Trawool 1940 B Coy.jpg` — B Company formation photo, Trawool
4. `2 21st Bn Band Darwin 41.jpg` — Band photo, Darwin 1941

---

## Next Steps

1. Run ACF field audit on vmoeoorvf.elementor.cloud
2. Match actual field names/keys to proposed mapping above
3. Confirm hero image selection with client
4. Confirm whether audio autoplay is desired (accessibility consideration)
