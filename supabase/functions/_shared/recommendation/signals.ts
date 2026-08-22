export const SIGNAL_STRENGTH = Object.freeze({
  recommendation_impression: 0.05,
  recommendation_open: 0.25,
  post_open: 0.2,
  post_like: 0.5,
  post_comment: 1.2,
  post_save: 1.4,
  post_share: 1.5,
  story_view: 0.15,
  story_complete: 0.45,
  story_reply: 1.8,
  video_start: 0.1,
  video_watch: 0.35,
  video_complete: 0.8,
  video_replay: 0.9,
  profile_view: 0.45,
  follow: 1.3,
  unfollow: -1.2,
  connection_request: 2.2,
  connection_accept: 3,
  connection_remove: -2,
  community_view: 0.4,
  community_join: 2.4,
  community_leave: -1.5,
  community_post: 1.5,
  event_view: 0.5,
  event_save: 1.3,
  event_rsvp: 2.7,
  event_attend: 4,
  not_interested: -2.5,
  see_more: 1,
  see_fewer: -1.5,
  mute: -3,
  hide: -2.5,
  block: -10,
  report: -10,
} as const)

export const LEARNED_SIGNAL_HALF_LIFE_DAYS = 45

export function timeDecay(ageDays: number, halfLifeDays = LEARNED_SIGNAL_HALF_LIFE_DAYS) {
  if (!Number.isFinite(ageDays) || ageDays <= 0) return 1
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) return 0
  return Math.exp((-Math.log(2) * ageDays) / halfLifeDays)
}

