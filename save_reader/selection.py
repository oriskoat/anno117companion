"""Bounded background selection; labels shortlist, full island evidence decides."""
def normalize(value):
    return str(value or '').strip().casefold()


def select_matching_profile(pipe, profiles, read, correlate, limit=4):
    label = normalize(pipe.get('session_name'))
    candidates = [p for p in profiles.values() if normalize(p['name']) == label]
    if not candidates:
        return {'status': 'no_candidate', 'reason': 'No discovered campaign label matches the running game.'}, None
    if len(candidates) > limit:
        return {'status': 'ambiguous', 'reason': 'Too many campaigns share this label; choose manually.'}, None
    matches, errors = [], []
    for profile in candidates:
        try:
            saved = read(profile)
            saved = {**saved, 'profile_name': profile['name'], 'source_profile_id': profile['id']}
            match = correlate(saved, pipe)
            if match['matched']:
                matches.append((profile, saved, match))
        except (OSError, ValueError) as error:
            errors.append(profile['id'])
    # An unreadable competing campaign cannot be ruled out.
    if len(matches) != 1 or errors:
        return {'status': 'ambiguous' if matches or errors else 'no_match',
                'candidate_ids': [p['id'] for p, _, _ in matches],
                'reason': 'A unique readable campaign/island match could not be established.'}, None
    profile, saved, match = matches[0]
    return {'status': 'matched', 'profile_id': profile['id'],
            'matched_area_keys': match['matched_area_keys'],
            'reason': 'Unique campaign label and island identity match. Following its latest save.'}, saved
