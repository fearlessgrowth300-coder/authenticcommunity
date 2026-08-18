import {
  BadgeCheck,
  Bookmark,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Upload,
  UserPlus,
  UserCheck,
  UsersRound,
  Video,
  X,
  EyeOff,
  Compass,
  CalendarDays,
  MapPin,
  Film,
} from 'lucide-react'
import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar, Button, Card, Chip, Field, inputClass, Verified } from '../components/ui'
import { useMockApp } from '../lib/mockApp'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import {
  loadFeedPage,
  togglePostLike,
  togglePostSave,
  toggleUserFollow,
  dismissFeedItem,
  loadPostComments,
  addPostComment,
  recordFeedInteraction,
  createPostWithMedia,
  type FeedTab,
  type FeedItem,
  type PostFeedItem,
  type SuggestedProfileFeedItem,
  type SuggestedCommunityFeedItem,
  type SuggestedEventFeedItem,
  type CommentRecord,
  type CreatePostInput,
} from '../lib/feedApi'

export function Feed() {
  const [tab, setTab] = useState<FeedTab>('For You')
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const { toast } = useMockApp()
  const navigate = useNavigate()

  const loadFeed = async (activeTab: FeedTab, pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await loadFeedPage({ tab: activeTab, page: pageNum, pageSize: 8 })
      if (append) {
        setItems(curr => [...curr, ...res.items])
      } else {
        setItems(res.items)
      }
      setHasMore(res.hasMore)
    } catch (err: any) {
      toast(err?.message || 'Failed to load feed.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    loadFeed(tab, 1, false)
  }, [tab])

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    loadFeed(tab, next, true)
  }

  const handleDismiss = async (itemId: string, type: 'post' | 'story' | 'user' | 'community') => {
    await dismissFeedItem(itemId, type)
    setItems(curr => curr.filter(i => i.id !== itemId))
    toast('Content hidden from your feed')
  }

  return (
    <AppShell
      title="Community Feed"
      subtitle="Content that helps you discover people, communities and local experiences"
    >
      <div className="mx-auto max-w-3xl">
        <Stories />

        {/* Home Feed Tabs */}
        <div className="sticky top-[65px] z-10 my-4 flex gap-2 bg-brand-canvas/95 py-2 backdrop-blur">
          {(['For You', 'Following', 'Nearby'] as FeedTab[]).map(x => (
            <button
              key={x}
              onClick={() => setTab(x)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                tab === x
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'border border-brand-line bg-white text-brand-muted hover:text-brand-ink'
              }`}
            >
              {x}
            </button>
          ))}
        </div>

        {/* Feed Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <Card key={n} className="p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full rounded bg-slate-100" />
                  <div className="h-4 w-4/5 rounded bg-slate-100" />
                </div>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center">
            {tab === 'Following' ? (
              <div>
                <UsersRound className="mx-auto mb-3 h-10 w-10 text-brand-500" />
                <h3 className="text-lg font-bold text-brand-ink">No following updates yet</h3>
                <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
                  Follow members or communities to see their latest thoughts and activities here.
                </p>
                <Button className="mt-5" onClick={() => navigate('/matches')}>
                  Discover Members
                </Button>
              </div>
            ) : tab === 'Nearby' ? (
              <div>
                <Compass className="mx-auto mb-3 h-10 w-10 text-brand-500" />
                <h3 className="text-lg font-bold text-brand-ink">No nearby posts right now</h3>
                <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
                  Be the first to share an update or event happening in your area!
                </p>
                <Button className="mt-5" onClick={() => navigate('/create/post')}>
                  Create Post
                </Button>
              </div>
            ) : (
              <div>
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-brand-500" />
                <h3 className="text-lg font-bold text-brand-ink">Your feed is getting ready</h3>
                <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
                  Complete your profile and join local communities to personalize your experience.
                </p>
                <Button className="mt-5" onClick={() => navigate('/communities')}>
                  Explore Communities
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <div className="space-y-5">
            {items.map(item => {
              if (item.type === 'post') {
                return (
                  <PostCard
                    key={item.id}
                    post={item}
                    onDismiss={() => handleDismiss(item.id, 'post')}
                  />
                )
              } else if (item.type === 'suggested_profile') {
                return (
                  <SuggestedProfileCard
                    key={item.id}
                    profile={item}
                    onDismiss={() => handleDismiss(item.userId, 'user')}
                  />
                )
              } else if (item.type === 'suggested_community') {
                return (
                  <SuggestedCommunityCard
                    key={item.id}
                    community={item}
                    onDismiss={() => handleDismiss(item.communityId, 'community')}
                  />
                )
              } else if (item.type === 'suggested_event') {
                return <SuggestedEventCard key={item.id} event={item} />
              }
              return null
            })}

            {hasMore && (
              <div className="pt-2 text-center">
                <Button
                  variant="secondary"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-3"
                >
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading more...
                    </span>
                  ) : (
                    'Load More Posts'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function Stories() {
  const navigate = useNavigate()
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
      <button onClick={() => navigate('/create')} className="shrink-0 text-center">
        <div className="relative rounded-full bg-gradient-to-tr from-brand-coral via-brand-500 to-brand-sage p-[3px]">
          <div className="rounded-full bg-white p-[2px]">
            <Avatar size="lg" />
          </div>
          <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-brand-500 text-white ring-2 ring-white">
            <Plus className="h-3 w-3" />
          </span>
        </div>
        <div className="mt-1 max-w-16 truncate text-[11px] font-semibold">Your Story</div>
      </button>

      <button onClick={() => navigate('/stories')} className="shrink-0 text-center">
        <div className="relative rounded-full bg-gradient-to-tr from-brand-coral via-brand-500 to-brand-sage p-[3px]">
          <div className="rounded-full bg-white p-[2px]">
            <Avatar
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85"
              name="Maya"
              size="lg"
            />
          </div>
        </div>
        <div className="mt-1 max-w-16 truncate text-[11px] font-semibold">Maya</div>
      </button>

      <button onClick={() => navigate('/stories')} className="shrink-0 text-center">
        <div className="relative rounded-full bg-gradient-to-tr from-brand-coral via-brand-500 to-brand-sage p-[3px]">
          <div className="rounded-full bg-white p-[2px]">
            <Avatar
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85"
              name="Alex"
              size="lg"
            />
          </div>
        </div>
        <div className="mt-1 max-w-16 truncate text-[11px] font-semibold">Alex</div>
      </button>

      <button onClick={() => navigate('/stories')} className="shrink-0 text-center">
        <div className="relative rounded-full bg-gradient-to-tr from-brand-coral via-brand-500 to-brand-sage p-[3px]">
          <div className="rounded-full bg-white p-[2px]">
            <Avatar
              src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85"
              name="Hikers"
              size="lg"
            />
          </div>
        </div>
        <div className="mt-1 max-w-16 truncate text-[11px] font-semibold">Hikers</div>
      </button>
    </div>
  )
}

function PostCard({ post, onDismiss }: { post: PostFeedItem; onDismiss: () => void }) {
  const navigate = useNavigate()
  const { toast } = useMockApp()

  const [isLiked, setIsLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [isSaved, setIsSaved] = useState(post.isSaved)
  const [isFollowing, setIsFollowing] = useState(post.isFollowingAuthor)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentRecord[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [showOptions, setShowOptions] = useState(false)

  const handleLike = async () => {
    try {
      const nextLiked = !isLiked
      setIsLiked(nextLiked)
      setLikesCount(c => c + (nextLiked ? 1 : -1))
      await togglePostLike(post.id, isLiked)
    } catch (err: any) {
      setIsLiked(isLiked)
      setLikesCount(post.likesCount)
      toast(err?.message || 'Action failed')
    }
  }

  const handleSave = async () => {
    try {
      const nextSaved = !isSaved
      setIsSaved(nextSaved)
      await togglePostSave(post.id, isSaved)
      toast(nextSaved ? 'Post saved to bookmarks' : 'Post removed from saved')
    } catch (err: any) {
      setIsSaved(isSaved)
      toast(err?.message || 'Action failed')
    }
  }

  const handleFollow = async () => {
    try {
      const nextFollow = !isFollowing
      setIsFollowing(nextFollow)
      await toggleUserFollow(post.authorId, isFollowing)
      toast(nextFollow ? `Following ${post.authorName}` : `Unfollowed ${post.authorName}`)
    } catch (err: any) {
      setIsFollowing(isFollowing)
      toast(err?.message || 'Action failed')
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/feed#${post.id}`
    navigator.clipboard.writeText(url)
    recordFeedInteraction({ interactionType: 'share', postId: post.id })
    toast('Share link copied to clipboard')
  }

  const handleOpenComments = async () => {
    const next = !showComments
    setShowComments(next)
    if (next && comments.length === 0) {
      setLoadingComments(true)
      try {
        const list = await loadPostComments(post.id)
        setComments(list)
      } catch (err: any) {
        toast('Failed to load comments.')
      } finally {
        setLoadingComments(false)
      }
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim()) return

    setSubmittingComment(true)
    try {
      const newComment = await addPostComment(post.id, commentInput.trim())
      setComments(curr => [...curr, newComment])
      setCommentInput('')
      toast('Comment posted')
    } catch (err: any) {
      toast(err?.message || 'Failed to post comment.')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleAuthorClick = () => {
    recordFeedInteraction({
      interactionType: 'profile_open',
      postId: post.id,
      metadata: { authorId: post.authorId },
    })
    navigate(`/matches/${post.authorId}`)
  }

  const mediaList = post.media || []

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={handleAuthorClick} className="flex items-center gap-3 text-left">
          <Avatar src={post.authorAvatar || undefined} name={post.authorName} />
          <div>
            <div className="flex items-center gap-1 font-bold text-brand-ink hover:underline">
              {post.authorName}
              {post.isVerified && <Verified />}
            </div>
            <div className="text-xs text-brand-muted">
              {post.timeAgo} {post.tag && `· ${post.tag}`} {post.locationLabel && `· ${post.locationLabel}`}
            </div>
          </div>
        </button>

        <div className="ml-auto relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Post options"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {showOptions && (
            <div className="absolute right-0 top-8 z-20 w-48 rounded-xl border border-brand-line bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setShowOptions(false)
                  toast('You see this post because it matches your interests and location.')
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Sparkles className="h-4 w-4 text-brand-500" /> Why am I seeing this?
              </button>
              <button
                onClick={() => {
                  setShowOptions(false)
                  onDismiss()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <EyeOff className="h-4 w-4" /> Hide this post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Text */}
      {post.text && <p className="px-4 pb-4 text-sm leading-6 text-slate-800">{post.text}</p>}

      {/* Media: Single Image / Carousel / Video */}
      {mediaList.length === 1 && (
        <div className="relative">
          {mediaList[0].type === 'video' ? (
            <div className="relative aspect-[16/9] bg-black">
              <video src={mediaList[0].url} controls className="h-full w-full object-cover" />
            </div>
          ) : (
            <img
              src={mediaList[0].url}
              alt="Post attachment"
              className="max-h-[560px] w-full object-cover"
            />
          )}
        </div>
      )}

      {mediaList.length > 1 && (
        <div className="relative overflow-hidden bg-black">
          <img
            src={mediaList[carouselIdx]?.url}
            alt={`Slide ${carouselIdx + 1}`}
            className="max-h-[560px] w-full object-cover"
          />
          {carouselIdx > 0 && (
            <button
              onClick={() => setCarouselIdx(c => c - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur hover:bg-black/70"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {carouselIdx < mediaList.length - 1 && (
            <button
              onClick={() => setCarouselIdx(c => c + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur hover:bg-black/70"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {mediaList.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === carouselIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-1 border-t border-brand-line p-2">
        <Action
          onClick={handleLike}
          icon={
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-brand-coral text-brand-coral' : ''}`} />
          }
          label={likesCount}
        />
        <Action
          onClick={handleOpenComments}
          icon={<MessageCircle className="h-4 w-4" />}
          label={post.commentsCount + comments.length}
        />
        <Action
          onClick={handleSave}
          icon={
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-brand-500 text-brand-500' : ''}`} />
          }
          label="Save"
        />
        <Action onClick={handleShare} icon={<Share2 className="h-4 w-4" />} label="Share" />

        <Button
          className="ml-auto py-1.5 px-3 text-xs"
          variant={isFollowing ? 'secondary' : 'default'}
          onClick={handleFollow}
        >
          {isFollowing ? (
            <span className="inline-flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Following
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <UserPlus className="h-3.5 w-3.5" /> Connect
            </span>
          )}
        </Button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="border-t border-brand-line bg-brand-canvas/50 p-4">
          {loadingComments ? (
            <div className="py-4 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-xs text-brand-muted text-center py-2">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-2.5 text-xs">
                    <Avatar src={c.authorAvatar || undefined} name={c.authorName} size="sm" />
                    <div className="flex-1 rounded-2xl bg-white p-3 border border-brand-line">
                      <div className="flex items-center justify-between font-bold text-brand-ink">
                        <span>{c.authorName}</span>
                        <span className="text-[10px] text-brand-muted font-normal">{c.timeAgo}</span>
                      </div>
                      <p className="mt-1 text-slate-700">{c.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Add a friendly reply..."
              className="flex-1 rounded-xl border border-brand-line bg-white px-3 py-2 text-xs outline-none focus:border-brand-500"
            />
            <Button type="submit" size="sm" disabled={submittingComment || !commentInput.trim()}>
              {submittingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </form>
        </div>
      )}
    </Card>
  )
}

function SuggestedProfileCard({
  profile,
  onDismiss,
}: {
  profile: SuggestedProfileFeedItem
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  const { toast } = useMockApp()
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing)

  const handleFollow = async () => {
    try {
      const next = !isFollowing
      setIsFollowing(next)
      await toggleUserFollow(profile.userId, isFollowing)
      toast(next ? `Connected with ${profile.name}` : `Unfollowed ${profile.name}`)
    } catch {
      setIsFollowing(isFollowing)
    }
  }

  return (
    <Card className="overflow-hidden border-brand-500/20 bg-gradient-to-r from-brand-50/50 via-white to-brand-50/30 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600">
          <Sparkles className="h-3.5 w-3.5" /> Suggested Member for You
        </div>
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Avatar src={profile.avatar || undefined} name={profile.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-brand-ink text-base truncate">{profile.name}</div>
          <div className="text-xs text-brand-muted">{profile.city} · {profile.distance}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.interests.slice(0, 3).map(interest => (
              <Chip key={interest}>{interest}</Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button className="flex-1 text-xs py-2" onClick={() => navigate(`/matches/${profile.userId}`)}>
          View Profile
        </Button>
        <Button variant={isFollowing ? 'secondary' : 'default'} className="text-xs py-2" onClick={handleFollow}>
          {isFollowing ? 'Following' : 'Connect'}
        </Button>
      </div>
    </Card>
  )
}

function SuggestedCommunityCard({
  community,
  onDismiss,
}: {
  community: SuggestedCommunityFeedItem
  onDismiss: () => void
}) {
  const navigate = useNavigate()
  return (
    <Card className="overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600">
          <UsersRound className="h-3.5 w-3.5" /> Local Community
        </div>
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <img src={community.image} alt={community.name} className="h-16 w-16 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="font-extrabold text-brand-ink truncate">{community.name}</div>
          <div className="text-xs text-brand-muted">{community.membersCount} members · {community.distance}</div>
          <p className="mt-1 text-xs text-slate-600 line-clamp-1">{community.description}</p>
        </div>
      </div>

      <Button
        variant="secondary"
        className="mt-4 w-full text-xs"
        onClick={() => navigate(`/communities/${community.communityId}`)}
      >
        View Community
      </Button>
    </Card>
  )
}

function SuggestedEventCard({ event }: { event: SuggestedEventFeedItem }) {
  const navigate = useNavigate()
  return (
    <Card className="overflow-hidden p-5 bg-gradient-to-br from-white via-white to-brand-50/40">
      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-3">
        <CalendarDays className="h-3.5 w-3.5" /> Happening Nearby
      </div>
      <div className="flex gap-4">
        <img src={event.image} alt={event.title} className="h-16 w-20 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-brand-ink truncate text-sm">{event.title}</div>
          <div className="text-xs text-brand-muted">{event.date} · {event.time}</div>
          <div className="mt-1 text-xs font-semibold text-brand-600">{event.distance}</div>
        </div>
      </div>
      <Button
        variant="secondary"
        className="mt-4 w-full text-xs"
        onClick={() => navigate(`/events/${event.eventId}`)}
      >
        View Event Details
      </Button>
    </Card>
  )
}

function Action({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string | number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-brand-muted hover:bg-brand-canvas transition"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function Videos() {
  const navigate = useNavigate()
  const { toast } = useMockApp()

  const videoItems = [
    {
      id: 'v1',
      author: 'Maya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
      community: 'Austin Hikers',
      text: 'Morning sunrise trail with the crew 🌿 Come join next weekend!',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=90',
      likes: 142,
      comments: 28,
    },
    {
      id: 'v2',
      author: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
      community: 'Startup Circle',
      text: 'Coffee and candid founder conversations. Building local community step by step.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=90',
      likes: 96,
      comments: 14,
    },
  ]

  return (
    <AppShell title="Videos" subtitle="Short-form discovery with a path to real connections">
      <div className="mx-auto max-w-xl space-y-6">
        {videoItems.map(p => (
          <Card key={p.id} className="relative aspect-[9/16] max-h-[78vh] overflow-hidden bg-black">
            <img src={p.image} className="h-full w-full object-cover opacity-85" alt={p.text} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
            <button
              onClick={() => toast('Video playback enabled')}
              className="absolute inset-0 grid place-items-center"
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:scale-105 transition-transform">
                <Play className="h-8 w-8 fill-white" />
              </div>
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="flex items-center gap-2">
                <Avatar src={p.avatar} name={p.author} />
                <div>
                  <div className="flex items-center gap-1 font-bold">
                    {p.author}
                    <Verified />
                  </div>
                  <div className="text-xs text-white/70">{p.community}</div>
                </div>
                <Button className="ml-auto py-2">Connect</Button>
              </div>
              <p className="mt-4 text-sm">{p.text}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-white/90">
                <span>♡ {p.likes}</span>
                <span>💬 {p.comments}</span>
                <span>↗ Share</span>
              </div>
              <Button
                variant="secondary"
                className="mt-4 bg-white/95 text-brand-ink"
                onClick={() => navigate('/communities')}
              >
                View Community
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}

export function CreateHub() {
  const navigate = useNavigate()
  return (
    <AppShell title="Create" subtitle="Share something that moves a relationship forward">
      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
        {[
          ['Post', 'Text, image or carousel', ImageIcon, '/create/post'],
          ['Story', '24-hour photo, video or question', Camera, '/stories'],
          ['Video', 'Short vertical discovery video', Video, '/videos'],
          ['Event', 'Bring the community together offline', UsersRound, '/events/create'],
        ].map(([title, desc, I, route]) => {
          const Icon = I as any
          return (
            <Card key={title as string} className="p-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4 text-lg font-extrabold text-brand-ink">{title as string}</div>
              <div className="mt-1 text-sm text-brand-muted">{desc as string}</div>
              <Button className="mt-5 w-full" onClick={() => navigate(route as string)}>
                Create {title as string}
              </Button>
            </Card>
          )
        })}
      </div>
    </AppShell>
  )
}

export function CreatePost() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useMockApp()

  const [text, setText] = useState('')
  const [audience, setAudience] = useState<'public' | 'followers' | 'connections' | 'community'>('public')
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('')
  const [locationLabel, setLocationLabel] = useState<string>('')
  const [showLocationInput, setShowLocationInput] = useState(false)
  const [showCommunitySelect, setShowCommunitySelect] = useState(false)

  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<Array<{ url: string; type: 'image' | 'video'; name: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [postingStatus, setPostingStatus] = useState<string>('')

  const [userProfile, setUserProfile] = useState<any>(null)
  const [communitiesList, setCommunitiesList] = useState<Array<{ id: string; community_name: string }>>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return

    // Load profile
    supabase
      .from('profiles')
      .select('first_name, last_name, profile_image_url, location_city, location_state')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setUserProfile(data)
          if (data.location_city) {
            setLocationLabel(`${data.location_city}${data.location_state ? `, ${data.location_state}` : ''}`)
          }
        }
      })

    // Load communities for tagging
    ;(supabase as any)
      .from('communities')
      .select('id, community_name')
      .eq('is_active', true)
      .limit(30)
      .then(({ data }: any) => {
        if (data) setCommunitiesList(data)
      })
  }, [user])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check if video was already attached
    const hasVideo = mediaPreviews.some(m => m.type === 'video')
    if (hasVideo) {
      toast('Cannot mix videos and images in a single post. Clear video first.')
      return
    }

    if (mediaFiles.length + files.length > 8) {
      toast('Maximum 8 images allowed per carousel post.')
      return
    }

    // Validate size
    for (const f of files) {
      if (f.size > 15 * 1024 * 1024) {
        toast(`Image "${f.name}" exceeds 15MB size limit.`)
        return
      }
    }

    const newFiles = [...mediaFiles, ...files]
    setMediaFiles(newFiles)

    const newPreviews = files.map(f => ({
      url: URL.createObjectURL(f),
      type: 'image' as const,
      name: f.name,
    }))
    setMediaPreviews(curr => [...curr, ...newPreviews])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (mediaPreviews.length > 0) {
      toast('Videos cannot be combined with other media. Replacing existing attachments.')
    }

    if (file.size > 100 * 1024 * 1024) {
      toast('Video exceeds the 100MB size limit.')
      return
    }

    setMediaFiles([file])
    setMediaPreviews([
      {
        url: URL.createObjectURL(file),
        type: 'video',
        name: file.name,
      },
    ])
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const removeMedia = (index: number) => {
    setMediaFiles(curr => curr.filter((_, i) => i !== index))
    setMediaPreviews(curr => {
      const removed = curr[index]
      if (removed) URL.revokeObjectURL(removed.url)
      return curr.filter((_, i) => i !== index)
    })
  }

  const handlePublish = async () => {
    if (!text.trim() && mediaFiles.length === 0) {
      toast('Please write a caption or attach media before publishing.')
      return
    }

    if (!user) {
      toast('Sign in to publish posts.')
      return
    }

    setSubmitting(true)
    setPostingStatus('Preparing post...')

    try {
      await createPostWithMedia({
        content: text.trim(),
        mediaFiles,
        visibility: audience,
        communityId: selectedCommunityId || null,
        locationLabel: locationLabel.trim() || null,
        onProgress: status => setPostingStatus(status),
      })

      toast('Your post is live in the feed!')
      navigate('/feed')
    } catch (err: any) {
      toast(err?.message || 'Failed to publish post.')
    } finally {
      setSubmitting(false)
      setPostingStatus('')
    }
  }

  const authorName = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'You'
    : 'You'

  return (
    <AppShell title="Create Post" subtitle="Share something worth responding to">
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar src={userProfile?.profile_image_url || undefined} name={authorName} />
            <div className="flex-1">
              <div className="font-bold text-brand-ink">{authorName}</div>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={audience}
                  onChange={e => setAudience(e.target.value as any)}
                  className="rounded-lg bg-brand-canvas px-2.5 py-1 text-xs font-semibold border border-brand-line outline-none text-brand-ink"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers only</option>
                  <option value="connections">Connections only</option>
                  <option value="community">Community only</option>
                </select>

                {locationLabel && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-brand-muted bg-brand-canvas px-2 py-0.5 rounded-md">
                    <MapPin className="h-3 w-3 text-brand-500" /> {locationLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Caption Area */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            className="mt-4 w-full resize-none border-none text-base outline-none placeholder:text-slate-400 text-brand-ink"
            placeholder="What's on your mind? Share an insight, question, or local experience..."
          />

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
            onChange={handleVideoSelect}
            className="hidden"
          />

          {/* Media Attachments Preview */}
          {mediaPreviews.length > 0 && (
            <div className="mt-3">
              {mediaPreviews.length === 1 && mediaPreviews[0].type === 'video' ? (
                <div className="relative rounded-2xl overflow-hidden border border-brand-line bg-black max-h-72">
                  <video src={mediaPreviews[0].url} controls className="w-full h-full object-contain max-h-72" />
                  <button
                    onClick={() => removeMedia(0)}
                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                    aria-label="Remove video"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : mediaPreviews.length === 1 ? (
                <div className="relative rounded-2xl overflow-hidden border border-brand-line max-h-72">
                  <img src={mediaPreviews[0].url} alt="Preview" className="w-full object-cover max-h-72" />
                  <button
                    onClick={() => removeMedia(0)}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                /* Multi-image carousel previews */
                <div>
                  <div className="text-xs font-semibold text-brand-muted mb-2">
                    Image Carousel ({mediaPreviews.length} of 8 images)
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {mediaPreviews.map((m, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-brand-line group">
                        <img src={m.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeMedia(idx)}
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                          aria-label={`Remove image ${idx + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <span className="absolute left-1.5 bottom-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white font-bold">
                          {idx + 1}
                        </span>
                      </div>
                    ))}
                    {mediaPreviews.length < 8 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="grid place-items-center aspect-square rounded-xl border-2 border-dashed border-brand-line text-brand-muted hover:border-brand-500 hover:text-brand-600 transition"
                      >
                        <Plus className="h-5 w-5" />
                        <span className="text-[10px] font-bold mt-1">Add more</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Optional Community selector */}
          {showCommunitySelect && (
            <div className="mt-4 rounded-xl bg-brand-canvas p-3 border border-brand-line">
              <label className="text-xs font-bold text-brand-ink block mb-1">Post in a Community (Optional)</label>
              <select
                value={selectedCommunityId}
                onChange={e => setSelectedCommunityId(e.target.value)}
                className="w-full rounded-lg bg-white px-3 py-2 text-xs font-semibold border border-brand-line outline-none text-brand-ink"
              >
                <option value="">General Feed (No specific community)</option>
                {communitiesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.community_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Location Input */}
          {showLocationInput && (
            <div className="mt-4 rounded-xl bg-brand-canvas p-3 border border-brand-line">
              <label className="text-xs font-bold text-brand-ink block mb-1">Location Label (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationLabel}
                  onChange={e => setLocationLabel(e.target.value)}
                  placeholder="e.g. Austin, Texas or Zilker Park"
                  className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold border border-brand-line outline-none text-brand-ink"
                />
                {userProfile?.location_city && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs py-1"
                    onClick={() =>
                      setLocationLabel(
                        `${userProfile.location_city}${userProfile.location_state ? `, ${userProfile.location_state}` : ''}`
                      )
                    }
                  >
                    Use City
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Media
              onClick={() => fileInputRef.current?.click()}
              icon={<ImageIcon />}
              label={mediaPreviews.some(m => m.type === 'image') ? `${mediaPreviews.length} Photo(s)` : 'Photos'}
            />
            <Media
              onClick={() => videoInputRef.current?.click()}
              icon={<Film />}
              label={mediaPreviews.some(m => m.type === 'video') ? 'Video Ready' : 'Video'}
            />
            <Media
              onClick={() => setShowCommunitySelect(!showCommunitySelect)}
              icon={<UsersRound />}
              label={selectedCommunityId ? 'Community Tagged' : 'Community'}
            />
            <Media
              onClick={() => setShowLocationInput(!showLocationInput)}
              icon={<MapPin />}
              label={locationLabel ? 'Location Set' : 'Location'}
            />
            <Media
              onClick={() =>
                setText(
                  current =>
                    current ||
                    'A great local moment with people who make this community feel like home.'
                )
              }
              icon={<Sparkles />}
              label="AI Assist"
            />
          </div>

          {/* Posting Status Feedback */}
          {submitting && postingStatus && (
            <div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-700 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
              <span>{postingStatus}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button className="mt-5 w-full py-3" onClick={handlePublish} disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing Post...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Send className="h-4 w-4" /> Post
              </span>
            )}
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}

function Media({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl bg-brand-canvas p-3 text-xs font-semibold text-brand-muted hover:bg-slate-100 transition"
    >
      <span className="text-brand-500">{icon}</span>
      <span className="truncate max-w-full">{label}</span>
    </button>
  )
}

export function Verification() {
  const { user } = useAuth()
  const { toast } = useMockApp()
  return (
    <AppShell title="Get Verified" subtitle="Verification proves account identity. It is separate from Premium.">
      <div className="mx-auto max-w-2xl space-y-5">
        <Card className="p-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-50 text-brand-600">
            <BadgeCheck className="h-10 w-10" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-brand-ink">Identity Verified</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">
            Help people know that the person behind your profile passed identity and safety verification.
          </p>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <VerifyStep done title="Verify email address" />
            <VerifyStep title="Submit identity document" />
            <VerifyStep title="Complete selfie / liveness check" />
            <VerifyStep title="Verification review" />
          </div>
          <Button className="mt-6 w-full" onClick={() => toast('Verification started with identity provider.')}>
            Start verification
          </Button>
          <p className="mt-3 text-xs text-brand-muted text-center">
            Verification is handled by a specialized identity provider. We never store raw identity documents.
          </p>
        </Card>
      </div>
    </AppShell>
  )
}

function VerifyStep({ title, done = false }: { title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-brand-canvas p-4">
      <div
        className={`grid h-9 w-9 place-items-center rounded-full ${
          done ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-brand-muted shadow-sm'
        }`}
      >
        {done ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-4 w-4" />}
      </div>
      <div className="font-bold text-brand-ink text-sm">{title}</div>
    </div>
  )
}

export function StoriesViewer() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#0B1020] text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col">
        <div className="flex gap-1 p-3">
          {[1, 2, 3, 4].map((n, i) => (
            <div key={n} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div className={`h-full rounded-full bg-white ${i === 0 ? 'w-2/3' : 'w-0'}`} />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2">
          <Avatar
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85"
            name="Maya Patel"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1 font-bold">
              Maya Patel
              <Verified />
            </div>
            <div className="text-xs text-white/60">12m · Austin Hikers</div>
          </div>
          <button onClick={() => navigate(-1)}>
            <X className="h-6 w-6 text-white/80" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=90"
            className="h-full w-full object-cover"
            alt="Story content"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-5 right-5">
            <div className="text-2xl font-extrabold">Weekend trail crew 🌿</div>
            <div className="mt-2 text-sm text-white/80">Anyone joining next Saturday?</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-white/20 px-4 py-3 text-sm font-bold backdrop-blur hover:bg-white/30">
                I'm in
              </button>
              <button className="rounded-xl bg-white/20 px-4 py-3 text-sm font-bold backdrop-blur hover:bg-white/30">
                Maybe
              </button>
            </div>
          </div>
        </div>

        <div className="safe-bottom flex items-center gap-2 p-4">
          <input
            className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/50 text-white"
            placeholder="Reply to story..."
          />
          <button className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-600">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
