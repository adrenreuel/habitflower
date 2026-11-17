// My HabitFlowers widget (WidgetSmall / WidgetMedium / WidgetLarge mockups).
// Reads the snapshot the app writes to the shared App Group
// (src/widgets/snapshot.ts). Shows six flowers in their real stage and
// health, never habit names. Tap a flower to open that habit.

import SwiftUI
import WidgetKit

// Must match `extra.appGroup` / the app's entitlements in app.json.
let appGroup = "group.com.habitflower.app"

// MARK: - Data

struct WidgetFlower: Codable, Identifiable {
  let id: String
  let kind: String
  let stage: String
  let health: String
  let count: Int
  let status: String  // due | done | rest | later
  let label: String
  let tone: String  // wilting | driedUp | done | due | muted
}

struct Snapshot: Codable {
  let leftToday: Int
  let flowers: [WidgetFlower]
}

func loadSnapshot() -> Snapshot? {
  guard let raw = UserDefaults(suiteName: appGroup)?.string(forKey: "snapshot"),
    let data = raw.data(using: .utf8)
  else { return nil }
  return try? JSONDecoder().decode(Snapshot.self, from: data)
}

// MARK: - Tokens (docs/handoff/HANDOFF.md section 5)

extension Color {
  init(hex: UInt32, alpha: Double = 1) {
    self.init(
      .sRGB, red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255, opacity: alpha)
  }
  static let hfSheet = Color(hex: 0x241628)
  static let hfText = Color(hex: 0xF6EEF8)
  static let hfChipMuted = Color(hex: 0xC9B9CF)
  static let hfAccent = Color(hex: 0x74D447)
  static let hfDivider = Color(hex: 0x3D2D43)
  static let hfBadgeOff = Color(hex: 0x4A3950)
  static let hfWilting = Color(hex: 0xFFB894)
  static let hfDriedUp = Color(hex: 0xFF7B7B)
  static let hfDone = Color(hex: 0x9BE36F)
  static let hfMuted = Color(hex: 0x8C7992)
  static let hfOnAccent = Color(hex: 0x1F1023)
}

extension Font {
  static func jakarta(_ size: CGFloat, _ weight: Int) -> Font {
    let name =
      weight >= 800
      ? "PlusJakartaSans-ExtraBold" : weight >= 700 ? "PlusJakartaSans-Bold" : "PlusJakartaSans-SemiBold"
    return .custom(name, size: size)
  }
}

// MARK: - Timeline

struct Entry: TimelineEntry {
  let date: Date
  let snapshot: Snapshot?
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry { Entry(date: .now, snapshot: sample) }
  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(Entry(date: .now, snapshot: loadSnapshot() ?? sample))
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    // The app reloads the widget on every change; refresh hourly so windows and the day rollover catch up.
    let next = Calendar.current.date(byAdding: .hour, value: 1, to: .now) ?? .now
    completion(Timeline(entries: [Entry(date: .now, snapshot: loadSnapshot())], policy: .after(next)))
  }

  var sample: Snapshot {
    Snapshot(
      leftToday: 5,
      flowers: [
        .init(id: "1", kind: "marigold", stage: "bloom", health: "ok", count: 4, status: "due", label: "1 of 3", tone: "due"),
        .init(id: "2", kind: "tulip", stage: "bud", health: "ok", count: 0, status: "due", label: "2 of 3", tone: "due"),
        .init(id: "3", kind: "lavender", stage: "bloom", health: "ok", count: 12, status: "later", label: "Opens 6 PM", tone: "muted"),
        .init(id: "4", kind: "daisy", stage: "bud", health: "dormant", count: 0, status: "due", label: "Dried up", tone: "driedUp"),
        .init(id: "5", kind: "sunflower", stage: "bloom", health: "ok", count: 21, status: "due", label: "5 of 8", tone: "due"),
        .init(id: "6", kind: "rose", stage: "bloom", health: "wilt", count: 3, status: "due", label: "Wilting", tone: "wilting"),
      ])
  }
}

// MARK: - Views

struct StatusBadge: View {
  let status: String
  let size: CGFloat

  var body: some View {
    switch status {
    case "due":
      // Small green down chevron above the flower, no circle.
      Image(systemName: "chevron.down")
        .font(.system(size: size * 0.7, weight: .heavy))
        .foregroundStyle(Color.hfAccent)
    case "done":
      badge(Image(systemName: "checkmark").font(.system(size: size * 0.55, weight: .heavy)).foregroundStyle(Color.hfOnAccent), bg: .hfAccent)
    case "rest":
      badge(Image(systemName: "moon.fill").font(.system(size: size * 0.5, weight: .bold)).foregroundStyle(Color.hfChipMuted), bg: .hfBadgeOff)
    default:
      badge(Image(systemName: "clock").font(.system(size: size * 0.55, weight: .bold)).foregroundStyle(Color.hfChipMuted), bg: .hfBadgeOff)
    }
  }

  func badge<V: View>(_ v: V, bg: Color) -> some View {
    v.frame(width: size, height: size)
      .background(Circle().fill(bg))
      .overlay(Circle().stroke(Color.hfSheet, lineWidth: 2))
  }
}

struct FlowerCell: View {
  let flower: WidgetFlower
  let size: CGFloat
  let badgeSize: CGFloat
  let showCount: Bool
  let showLabel: Bool

  var labelColor: Color {
    switch flower.tone {
    case "wilting": return .hfWilting
    case "driedUp": return .hfDriedUp
    case "done": return .hfDone
    case "due": return .hfChipMuted
    default: return .hfMuted
    }
  }

  var body: some View {
    Link(destination: URL(string: "habitflower://habit/\(flower.id)")!) {
      VStack(spacing: 2) {
        ZStack {
          Image("flower-\(flower.kind)-\(flower.stage)-\(flower.health)")
            .resizable()
            .interpolation(.high)
            .frame(width: size, height: size)
          if flower.status == "due" {
            StatusBadge(status: "due", size: badgeSize)
              .offset(y: -size / 2 - badgeSize * 0.2)
          } else {
            StatusBadge(status: flower.status, size: badgeSize)
              .offset(x: size / 2 - badgeSize / 2 - 2, y: -size / 2 + badgeSize / 2 + 2)
          }
          if showCount && flower.count > 0 {
            Text("\(flower.count)")
              .font(.jakarta(size > 70 ? 11 : 10, 800))
              .foregroundStyle(flower.health == "wilt" ? Color.hfWilting : Color.hfText)
              .padding(.horizontal, 5)
              .frame(minWidth: size > 70 ? 22 : 19, minHeight: size > 70 ? 20 : 17)
              .background(Capsule().fill(Color.hfDivider))
              .overlay(Capsule().stroke(Color.hfSheet, lineWidth: 2))
              .offset(x: size / 2 - 6, y: size / 2 - 10)
          }
        }
        .frame(width: size, height: size)
        if showLabel {
          Text(flower.label).font(.jakarta(11.5, 600)).foregroundStyle(labelColor).lineLimit(1)
        }
      }
    }
  }
}

struct Header: View {
  let titleSize: CGFloat
  let left: Int?

  var body: some View {
    HStack(alignment: .firstTextBaseline) {
      Text("My HabitFlowers").font(.jakarta(titleSize, 800)).foregroundStyle(Color.hfText).lineLimit(1)
      Spacer()
      if let left {
        Text(left == 0 ? "All done today" : "\(left) left today")
          .font(.jakarta(titleSize - 2.5, 700))
          .foregroundStyle(Color.hfChipMuted)
      }
    }
  }
}

struct EmptyState: View {
  var body: some View {
    VStack(spacing: 6) {
      Image("flower-sunflower-seed-ok").resizable().frame(width: 48, height: 48)
      Text("Plant your first HabitFlower").font(.jakarta(13, 700)).foregroundStyle(Color.hfChipMuted)
        .multilineTextAlignment(.center)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

struct HabitFlowersWidgetView: View {
  @Environment(\.widgetFamily) var family
  let entry: Entry

  var flowers: [WidgetFlower] { Array((entry.snapshot?.flowers ?? []).prefix(6)) }

  var body: some View {
    Group {
      switch family {
      case .systemSmall:
        VStack(alignment: .leading, spacing: 4) {
          Header(titleSize: 14, left: nil).padding(.horizontal, 4)
          if flowers.isEmpty { EmptyState() } else {
            grid(columns: 3, size: 50, badge: 14, count: false, label: false, spacing: 4)
          }
        }
      case .systemLarge:
        VStack(alignment: .leading, spacing: 6) {
          Header(titleSize: 16, left: entry.snapshot?.leftToday)
          if flowers.isEmpty { EmptyState() } else {
            grid(columns: 3, size: 78, badge: 20, count: true, label: true, spacing: 14).padding(.top, 6)
          }
        }
      default:
        VStack(alignment: .leading, spacing: 8) {
          Header(titleSize: 15, left: entry.snapshot?.leftToday)
          if flowers.isEmpty { EmptyState() } else {
            HStack(spacing: 2) {
              ForEach(flowers) { f in
                FlowerCell(flower: f, size: 52, badgeSize: 16, showCount: true, showLabel: false).frame(maxWidth: .infinity)
              }
            }
            .frame(maxHeight: .infinity, alignment: .bottom)
          }
        }
      }
    }
    .widgetURL(URL(string: "habitflower://"))
    .containerBackground(Color.hfSheet, for: .widget)
  }

  func grid(columns: Int, size: CGFloat, badge: CGFloat, count: Bool, label: Bool, spacing: CGFloat) -> some View {
    let cols = Array(repeating: GridItem(.flexible(), spacing: 4), count: columns)
    return LazyVGrid(columns: cols, spacing: spacing) {
      ForEach(flowers) { f in
        FlowerCell(flower: f, size: size, badgeSize: badge, showCount: count, showLabel: label)
      }
    }
    .frame(maxHeight: .infinity, alignment: .bottom)
  }
}

@main
struct HabitFlowersWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "HabitFlowersWidget", provider: Provider()) { entry in
      HabitFlowersWidgetView(entry: entry)
    }
    .configurationDisplayName("My HabitFlowers")
    .description("See your HabitFlowers at a glance.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}
