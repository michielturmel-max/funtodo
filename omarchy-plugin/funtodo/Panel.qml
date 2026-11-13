import QtQuick
import QtQuick.Controls
import Quickshell
import Quickshell.Io
import qs.Ui
import qs.Commons

// Funtodo in de bar: een tentje met het aantal open quests van vandaag.
// Linksklik opent het paneel, rechtsklik schakelt het, middenklik ververst.
// In het paneel vink je een rij af, schuif je hem door met d, of typ je met
// 'a' meteen een nieuwe quest. Alles loopt via bin/funtodo, dat met een token
// uit ~/.config/funtodo/plugin.json met de webapp praat.
Panel {
  id: root
  moduleName: "funtodo"
  ipcTarget: "funtodo"

  implicitWidth: button.implicitWidth
  implicitHeight: bar ? bar.barSize : 26

  readonly property string binDir: Quickshell.env("HOME") + "/.config/omarchy/plugins/funtodo/bin"
  readonly property string scriptPath: binDir + "/funtodo"
  readonly property int bodyFont: Style.font.body
  readonly property int captionFont: Style.font.caption
  readonly property int subtitleFont: Style.font.subtitle
  readonly property int pollInterval: Math.max(15, Number(setting("interval", 60)))

  readonly property var domains: [
    { key: "body", label: "Lijf" },
    { key: "mind", label: "Geest" },
    { key: "craft", label: "Vak" },
    { key: "social", label: "Samen" }
  ]
  readonly property var minutenKeuzes: [15, 25, 45, 60]

  property var status: null
  property string fout: ""
  property string melding: ""
  property bool bezig: false
  property int keuze: 0

  property int nieuweDomein: 2
  property int nieuweMinuten: 25
  property bool nieuweMain: false

  // Hoofdquest eerst, dan open, dan afgevinkt. De API-sortering is op status
  // en dat zet 'done' tussen 'active' en 'planned' in; hier telt de lezer.
  readonly property var quests: {
    var list = root.status && root.status.quests ? root.status.quests.slice() : []
    list.sort(function (a, b) {
      if ((a.status === "done") !== (b.status === "done")) return a.status === "done" ? 1 : -1
      if (a.isMain !== b.isMain) return a.isMain ? -1 : 1
      return 0
    })
    return list
  }
  readonly property int openCount: quests.filter(function (q) { return q.status !== "done" }).length
  readonly property int doneCount: quests.filter(function (q) { return q.status === "done" }).length
  readonly property var gekozen: quests.length > 0 ? quests[Math.min(root.keuze, quests.length - 1)] : null
  readonly property var speler: status && status.player ? status.player : null
  readonly property var week: status && status.week ? status.week : null
  readonly property var nextAlarm: status && status.nextAlarm ? status.nextAlarm : null
  readonly property bool alarmRinging: nextAlarm !== null && nextAlarm.state === "ringing"
  readonly property string barAlarm: nextAlarm === null ? "" : (alarmRinging ? "Nu" : nextAlarm.time)
  readonly property string appUrl: status && status.url ? status.url : "http://127.0.0.1:3000"
  readonly property string barCount: root.fout !== "" ? "!" : String(root.openCount)
  readonly property string barTip: {
    if (root.fout !== "") return "Funtodo: " + root.fout
    if (!root.status) return "Funtodo — quests laden…"
    var s = root.openCount + " open"
    if (root.doneCount > 0) s += " · " + root.doneCount + " af"
    if (root.speler && root.speler.coins !== undefined) s += " · " + root.speler.coins + " munten"
    if (root.nextAlarm) {
      s += "\nwekker " + (root.alarmRinging ? "gaat nu af" : root.nextAlarm.time)
      s += " · " + root.nextAlarm.title
    }
    return "Funtodo · " + s + "\nklik voor je quests van vandaag"
  }

  function datumLang(iso) {
    if (!iso) return ""
    var dagen = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"]
    var maanden = ["januari", "februari", "maart", "april", "mei", "juni", "juli",
      "augustus", "september", "oktober", "november", "december"]
    var d = new Date(iso + "T12:00:00")
    if (isNaN(d.getTime())) return iso
    return dagen[d.getDay()] + " " + d.getDate() + " " + maanden[d.getMonth()]
  }

  function meta(q) {
    if (!q) return ""
    var delen = [q.domainLabel, q.estimateMin + " min"]
    if (q.scheduledTime) delen.push(q.scheduledTime)
    if (q.isMain) delen.push("hoofdquest")
    if (q.bossMaxHp > 0) delen.push("baas " + q.bossHp + "/" + q.bossMaxHp)
    return delen.join(" · ")
  }

  function leesStatus(tekst) {
    root.bezig = false
    var data = null
    try { data = JSON.parse(String(tekst || "").trim()) } catch (e) { data = null }
    if (!data || data.ok === false) {
      root.fout = data && data.error ? String(data.error) : "kon quests niet lezen"
      return
    }
    root.fout = ""
    root.status = data
    if (root.keuze >= root.quests.length) root.keuze = Math.max(0, root.quests.length - 1)
  }

  function verversen() {
    if (statusProc.running) return
    root.bezig = true
    statusProc.command = [root.scriptPath, "status", "--json"]
    statusProc.running = true
  }

  function wissel(index) {
    var q = root.quests[index]
    if (!q || root.bezig) return
    root.keuze = index
    root.bezig = true
    root.fout = ""
    root.melding = q.status === "done" ? "zet terug…" : "vinkt af…"
    actieProc.command = [root.scriptPath, q.status === "done" ? "undo" : "done", q.id, "--json"]
    actieProc.running = true
  }

  function schuif(index) {
    var q = root.quests[index]
    if (!q || root.bezig) return
    root.bezig = true
    root.fout = ""
    root.melding = "schuift door naar morgen…"
    actieProc.command = [root.scriptPath, "defer", q.id, "--json"]
    actieProc.running = true
  }

  function snoozeNext() {
    if (!root.nextAlarm || root.bezig) return
    root.bezig = true
    root.fout = ""
    root.melding = "stelt de wekker uit…"
    actieProc.command = [root.scriptPath, "snooze", root.nextAlarm.id, "--min", "10", "--json"]
    actieProc.running = true
  }

  function voegToe() {    var titel = String(titelVeld.text || "").trim()
    if (!titel || root.bezig) {
      if (!titel) root.melding = "typ eerst een titel"
      return
    }
    root.bezig = true
    root.fout = ""
    root.melding = "voegt toe…"
    var argumenten = [
      root.scriptPath, "add", titel,
      "--domain", root.domains[root.nieuweDomein].key,
      "--min", String(root.nieuweMinuten),
      "--json"
    ]
    if (root.nieuweMain) argumenten.push("--main")
    actieProc.command = argumenten
    actieProc.running = true
  }

  function naActie(tekst) {
    root.bezig = false
    var data = null
    try { data = JSON.parse(String(tekst || "").trim()) } catch (e) { data = null }
    if (!data || data.ok === false) {
      root.melding = ""
      root.fout = data && data.error ? String(data.error) : "de actie lukte niet"
      return
    }
    root.fout = ""
    root.melding = data.message ? String(data.message) : "bijgewerkt"
    if (data.message === "toegevoegd") {
      titelVeld.text = ""
      keys.forceActiveFocus()
    }
    root.verversen()
    meldingTimer.restart()
  }

  function beweeg(dy) {
    if (root.quests.length === 0) return
    var volgende = root.keuze + dy
    if (volgende < 0) volgende = root.quests.length - 1
    if (volgende >= root.quests.length) volgende = 0
    root.keuze = volgende
  }

  function focusForm() {
    Qt.callLater(function () { titelVeld.forceActiveFocus() })
  }

  function toon() {
    if (root.opened) {
      root.close()
      return
    }
    root.open()
    root.verversen()
  }

  Process {
    id: statusProc
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.leesStatus(text)
    }
    stderr: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var regel = String(text || "").trim()
        if (regel !== "") root.fout = regel
      }
    }
    onExited: if (!statusProc.running) root.bezig = false
  }

  Process {
    id: actieProc
    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.naActie(text)
    }
    stderr: StdioCollector {
      waitForEnd: true
      onStreamFinished: {
        var regel = String(text || "").trim()
        if (regel !== "") root.fout = regel
      }
    }
    onExited: if (!statusProc.running) root.bezig = false
  }

  Timer {
    id: meldingTimer
    interval: 6000
    onTriggered: root.melding = ""
  }

  Timer {
    interval: root.pollInterval * 1000
    running: !root.opened
    repeat: true
    triggeredOnStart: true
    onTriggered: root.verversen()
  }

  onOpenedChanged: {
    if (!opened) return
    root.verversen()
    Qt.callLater(function () { keys.forceActiveFocus() })
  }

  // ---- bar ---------------------------------------------------------------

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    labelVisible: false
    hasVisualContent: true
    fixedWidth: root.nextAlarm !== null ? 104 : 48
    fixedHeight: root.bar ? root.bar.barSize : 26
    active: root.fout !== ""
    activeColor: Color.urgent
    tooltipText: root.barTip
    onPressed: function (knop) {
      if (knop === Qt.MiddleButton) {
        root.verversen()
        return
      }
      root.toon()
    }

    Item {
      id: icoon
      width: 20
      height: 20
      anchors.left: parent.left
      anchors.leftMargin: 5
      anchors.verticalCenter: parent.verticalCenter

      Canvas {
        id: tent
        anchors.fill: parent
        property color inkt: root.bar ? root.barForeground : Color.foreground
        property color accent: Color.accent
        onInktChanged: requestPaint()
        onAccentChanged: requestPaint()
        Component.onCompleted: requestPaint()

        onPaint: {
          var ctx = getContext("2d")
          var s = width / 24
          ctx.reset()
          ctx.clearRect(0, 0, 24, 24)
          ctx.save()
          ctx.scale(s, s)
          ctx.lineWidth = 1.8
          ctx.lineCap = "round"
          ctx.lineJoin = "round"

          ctx.strokeStyle = tent.inkt
          ctx.beginPath()
          ctx.moveTo(3.4, 19.6)
          ctx.lineTo(12, 6.4)
          ctx.lineTo(20.6, 19.6)
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(2, 20.8)
          ctx.lineTo(22, 20.8)
          ctx.stroke()

          ctx.strokeStyle = tent.accent
          ctx.beginPath()
          ctx.moveTo(9.1, 20.8)
          ctx.lineTo(12, 14.4)
          ctx.lineTo(14.9, 20.8)
          ctx.stroke()

          ctx.strokeStyle = tent.inkt
          ctx.beginPath()
          ctx.moveTo(12, 6.4)
          ctx.lineTo(12, 3.2)
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(12.3, 3.2)
          ctx.lineTo(17.8, 4.7)
          ctx.lineTo(12.3, 6.2)
          ctx.closePath()
          ctx.fillStyle = tent.accent
          ctx.fill()
          ctx.restore()
        }
      }
    }

    Text {
      anchors.left: parent.left
      anchors.leftMargin: 29
      anchors.verticalCenter: parent.verticalCenter
      text: root.barCount
      color: root.fout !== "" ? Color.urgent : (root.openCount > 0 ? Color.accent : Color.muted)
      font.family: root.bar ? root.bar.fontFamily : Style.font.family
      font.pixelSize: root.bodyFont
      font.bold: true
      renderType: Text.NativeRendering
    }

    Text {
      anchors.right: parent.right
      anchors.rightMargin: 6
      anchors.verticalCenter: parent.verticalCenter
      visible: root.nextAlarm !== null
      text: root.barAlarm
      color: root.alarmRinging
        ? Color.urgent
        : (root.nextAlarm && root.nextAlarm.snoozed ? Color.accent : Color.muted)
      font.family: root.bar ? root.bar.fontFamily : Style.font.family
      font.pixelSize: root.captionFont
      font.bold: root.alarmRinging
      renderType: Text.NativeRendering
    }
  }

  // ---- panel -------------------------------------------------------------

  KeyboardPanel {
    id: paneel
    anchorItem: button
    owner: root
    bar: root.bar
    open: root.opened
    focusTarget: keys
    contentWidth: Style.space(560)
    contentHeight: Style.space(540)

    PanelKeyCatcher {
      id: keys
      anchors.fill: parent
      blocked: titelVeld.activeFocus

      onMoveRequested: function (dx, dy) { root.beweeg(dy) }
      onActivateRequested: root.wissel(root.keuze)
      onCloseRequested: root.close()
      onDeleteRequested: root.schuif(root.keuze)

      onTextKey: function (t) {
        if (t === "a" || t === "A" || t === "/") { root.focusForm(); return }
        if (t === "r" || t === "R") { root.verversen(); return }
        if (t === "o" || t === "O") { Qt.openUrlExternally(root.appUrl); return }
        if (t === "d" || t === "D") { root.schuif(root.keuze); return }
        if (t === "s" || t === "S") { root.snoozeNext(); return }
        if (t === "q" || t === "Q") { root.close(); return }
        var nr = parseInt(t, 10)
        if (!isNaN(nr) && nr >= 1 && nr <= 9 && root.quests[nr - 1]) {
          root.keuze = nr - 1
        }
      }
    }

    Item {
      anchors.fill: parent

      Column {
        anchors.fill: parent
        anchors.margins: Style.space(16)
        spacing: Style.space(8)

        // kop
        Row {
          width: parent.width
          spacing: Style.space(8)

          Column {
            width: parent.width - 84
            spacing: Style.space(1)

            Text {
              text: "Funtodo"
              color: root.barForeground
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: root.subtitleFont
              font.bold: true
            }

            Text {
              width: parent.width
              text: {
                if (!root.status) return "quests laden…"
                var s = root.datumLang(root.status.today) + " · " + root.openCount + " open"
                if (root.doneCount > 0) s += " · " + root.doneCount + " af"
                if (root.status.inboxCount > 0) s += " · " + root.status.inboxCount + " in je inbox"
                return s
              }
              color: Color.muted
              font.family: root.bar ? root.bar.fontFamily : Style.font.family
              font.pixelSize: root.captionFont
              elide: Text.ElideRight
            }
          }

          Item {
            width: 22
            height: 22

            Rectangle {
              anchors.fill: parent
              radius: Style.cornerRadius
              color: verversMuis.containsMouse ? Color.menu.selectedBackground : "transparent"
            }

            Canvas {
              anchors.fill: parent
              property color inkt: root.barForeground
              onInktChanged: requestPaint()
              Component.onCompleted: requestPaint()
              onPaint: {
                var ctx = getContext("2d")
                var s = width / 22
                ctx.reset()
                ctx.clearRect(0, 0, 22, 22)
                ctx.save()
                ctx.scale(s, s)
                ctx.strokeStyle = inkt
                ctx.fillStyle = inkt
                ctx.lineWidth = 1.7
                ctx.lineCap = "round"
                ctx.beginPath()
                ctx.arc(11, 11, 6.6, -Math.PI * 0.15, Math.PI * 1.55)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(15.4, 3.4)
                ctx.lineTo(18.4, 5.4)
                ctx.lineTo(15.6, 7.4)
                ctx.closePath()
                ctx.fill()
                ctx.restore()
              }
            }

            MouseArea {
              id: verversMuis
              anchors.fill: parent
              hoverEnabled: true
              cursorShape: Qt.PointingHandCursor
              onClicked: root.verversen()
            }
          }

          Item {
            width: 22
            height: 22

            Rectangle {
              anchors.fill: parent
              radius: Style.cornerRadius
              color: openMuis.containsMouse ? Color.menu.selectedBackground : "transparent"
            }

            Canvas {
              anchors.fill: parent
              property color inkt: root.barForeground
              onInktChanged: requestPaint()
              Component.onCompleted: requestPaint()
              onPaint: {
                var ctx = getContext("2d")
                var s = width / 22
                ctx.reset()
                ctx.clearRect(0, 0, 22, 22)
                ctx.save()
                ctx.scale(s, s)
                ctx.strokeStyle = inkt
                ctx.lineWidth = 1.7
                ctx.lineCap = "round"
                ctx.lineJoin = "round"
                ctx.beginPath()
                ctx.moveTo(12.5, 4)
                ctx.lineTo(18, 4)
                ctx.lineTo(18, 9.5)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(17.6, 4.4)
                ctx.lineTo(9.8, 12.2)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(5, 8.4)
                ctx.lineTo(5, 18)
                ctx.lineTo(14.6, 18)
                ctx.lineTo(14.6, 13.4)
                ctx.stroke()
                ctx.restore()
              }
            }

            MouseArea {
              id: openMuis
              anchors.fill: parent
              hoverEnabled: true
              cursorShape: Qt.PointingHandCursor
              onClicked: Qt.openUrlExternally(root.appUrl)
            }
          }
        }

        // spelersregel
        Text {
          width: parent.width
          visible: root.speler !== null
          text: {
            if (!root.speler) return ""
            var s = root.speler.coins + " munten · " + root.speler.streak
              + (root.speler.streak === 1 ? " dag vuur" : " dagen vuur")
            if (root.week) s += " · " + root.week.minutes + " min deze week"
            return s
          }
          color: root.barForeground
          opacity: 0.82
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: root.captionFont
        }

        // wekker
        Rectangle {
          width: parent.width
          height: 40
          radius: Style.cornerRadius
          visible: root.nextAlarm !== null
          color: root.alarmRinging ? Color.urgent : Color.menu.background
          border.width: 1
          border.color: root.alarmRinging
            ? Color.urgent
            : (root.nextAlarm && root.nextAlarm.snoozed ? Color.accent : "transparent")

          Row {
            anchors.fill: parent
            anchors.leftMargin: Style.space(10)
            anchors.rightMargin: Style.space(6)
            spacing: Style.space(8)

            Column {
              width: parent.width - 76
              anchors.verticalCenter: parent.verticalCenter
              spacing: 1

              Text {
                width: parent.width
                text: {
                  if (!root.nextAlarm) return ""
                  var s = root.alarmRinging ? "Wekker · nu" : "Wekker · " + root.nextAlarm.time
                  if (root.nextAlarm.snoozed) s += " · uitgesteld"
                  return s
                }
                color: root.alarmRinging ? Color.background : root.barForeground
                font.family: root.bar ? root.bar.fontFamily : Style.font.family
                font.pixelSize: root.captionFont
                font.bold: true
                elide: Text.ElideRight
              }

              Text {
                width: parent.width
                text: root.nextAlarm ? root.nextAlarm.title : ""
                color: root.alarmRinging ? Color.background : Color.muted
                opacity: root.alarmRinging ? 0.85 : 1
                font.family: root.bar ? root.bar.fontFamily : Style.font.family
                font.pixelSize: root.captionFont
                elide: Text.ElideRight
              }
            }

            Rectangle {
              width: 62
              height: 26
              radius: 13
              anchors.verticalCenter: parent.verticalCenter
              color: "transparent"
              border.width: 1
              border.color: root.alarmRinging ? Color.background : Color.accent

              Text {
                anchors.centerIn: parent
                text: "10 min"
                color: root.alarmRinging ? Color.background : Color.accent
                font.family: root.bar ? root.bar.fontFamily : Style.font.family
                font.pixelSize: root.captionFont
                font.bold: true
              }

              MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: root.snoozeNext()
              }
            }
          }
        }

        // voortgang
        Row {
          width: parent.width
          height: 8
          spacing: Style.space(8)
          visible: root.quests.length > 0

          Rectangle {
            width: parent.width - 62
            height: 6
            radius: 3
            color: Color.menu.background

            Rectangle {
              width: root.quests.length > 0
                ? parent.width * root.doneCount / root.quests.length
                : 0
              height: parent.height
              radius: 3
              color: Color.accent
              Behavior on width { NumberAnimation { duration: 180 } }
            }
          }

          Text {
            width: 54
            text: root.doneCount + "/" + root.quests.length + " gedaan"
            color: Color.muted
            font.family: root.bar ? root.bar.fontFamily : Style.font.family
            font.pixelSize: root.captionFont
            horizontalAlignment: Text.AlignRight
          }
        }

        // meldingen
        Text {
          width: parent.width
          visible: root.fout !== "" || root.melding !== ""
          text: root.fout !== "" ? root.fout : root.melding
          color: root.fout !== "" ? Color.urgent : Color.accent
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: root.captionFont
          wrapMode: Text.WordWrap
        }

        // quests
        ListView {
          id: lijst
          width: parent.width
          height: root.nextAlarm !== null ? 198 : 236
          clip: true
          spacing: Style.space(4)
          model: root.quests
          currentIndex: root.keuze

          delegate: Rectangle {
            id: rij
            required property var modelData
            required property int index
            width: lijst.width
            height: 54
            radius: Style.cornerRadius
            color: index === root.keuze
              ? Color.menu.selectedBackground
              : (hover.containsMouse ? Color.menu.background : "transparent")
            border.width: index === root.keuze ? 1 : 0
            border.color: Color.accent

            Row {
              anchors.fill: parent
              anchors.margins: Style.space(8)
              spacing: Style.space(8)

              Rectangle {
                width: 20
                height: 20
                radius: 10
                anchors.verticalCenter: parent.verticalCenter
                color: rij.modelData.status === "done" ? Color.accent : "transparent"
                border.width: rij.modelData.status === "done" ? 0 : 1.5
                border.color: rij.modelData.status === "done" ? Color.accent : Color.muted

                Text {
                  anchors.centerIn: parent
                  visible: rij.modelData.status === "done"
                  text: "✓"
                  color: Color.background
                  font.pixelSize: 12
                  font.bold: true
                }
              }

              Column {
                width: parent.width - 28
                anchors.verticalCenter: parent.verticalCenter
                spacing: 1

                Text {
                  width: parent.width
                  text: rij.modelData.title
                  color: rij.modelData.status === "done" ? Color.muted : root.barForeground
                  font.family: root.bar ? root.bar.fontFamily : Style.font.family
                  font.pixelSize: root.subtitleFont
                  font.bold: rij.modelData.isMain
                  font.strikeout: rij.modelData.status === "done"
                  elide: Text.ElideRight
                }

                Text {
                  width: parent.width
                  text: root.meta(rij.modelData)
                  color: Color.muted
                  font.family: root.bar ? root.bar.fontFamily : Style.font.family
                  font.pixelSize: root.captionFont
                  elide: Text.ElideRight
                }
              }
            }

            MouseArea {
              id: hover
              anchors.fill: parent
              hoverEnabled: true
              cursorShape: Qt.PointingHandCursor
              onClicked: root.wissel(rij.index)
            }
          }
        }

        // leeg
        Text {
          width: parent.width
          height: 40
          visible: root.quests.length === 0
          text: root.bezig ? "even kijken…"
            : "Vandaag staat er nog niets op de kaart.\nTyp hieronder een stop, of druk op a."
          color: Color.muted
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: root.captionFont
          wrapMode: Text.WordWrap
          horizontalAlignment: Text.AlignHCenter
          verticalAlignment: Text.AlignVCenter
        }

        // snel toevoegen
        Rectangle {
          width: parent.width
          height: 108
          radius: Style.cornerRadius
          color: Color.menu.background
          border.width: 1
          border.color: titelVeld.activeFocus ? Color.accent : "transparent"

          Column {
            anchors.fill: parent
            anchors.margins: Style.space(8)
            spacing: Style.space(6)

            Row {
              width: parent.width
              spacing: Style.space(6)

              TextField {
                id: titelVeld
                width: parent.width - 92
                height: 32
                placeholderText: "Wat ga je doen?"
                placeholderTextColor: Color.muted
                color: root.barForeground
                font.family: root.bar ? root.bar.fontFamily : Style.font.family
                font.pixelSize: root.bodyFont
                verticalPadding: 4
                accent: Color.accent
                background: Rectangle {
                  color: "transparent"
                  radius: Style.cornerRadius
                  border.width: 1
                  border.color: titelVeld.activeFocus ? Color.accent : Color.muted
                }
                onAccepted: root.voegToe()
                Keys.onEscapePressed: function (event) {
                  keys.forceActiveFocus()
                  event.accepted = true
                }
                Keys.onDownPressed: function (event) {
                  if (root.quests.length > 0) root.keuze = 0
                  keys.forceActiveFocus()
                  event.accepted = true
                }
                Keys.onUpPressed: function (event) {
                  if (root.quests.length > 0) root.keuze = root.quests.length - 1
                  keys.forceActiveFocus()
                  event.accepted = true
                }
                Keys.priority: Keys.BeforeItem
              }

              Rectangle {
                width: 82
                height: 32
                radius: Style.cornerRadius
                color: voegMuis.containsMouse ? Color.accent : "transparent"
                border.width: 1
                border.color: Color.accent

                Text {
                  anchors.centerIn: parent
                  text: root.bezig ? "even…" : "Voeg toe"
                  color: voegMuis.containsMouse ? Color.background : Color.accent
                  font.family: root.bar ? root.bar.fontFamily : Style.font.family
                  font.pixelSize: root.bodyFont
                  font.bold: true
                }

                MouseArea {
                  id: voegMuis
                  anchors.fill: parent
                  hoverEnabled: true
                  cursorShape: Qt.PointingHandCursor
                  onClicked: root.voegToe()
                }
              }
            }

            Row {
              width: parent.width
              spacing: Style.space(5)

              Repeater {
                model: root.domains
                Rectangle {
                  required property var modelData
                  required property int index
                  width: chipTekst.implicitWidth + 14
                  height: 24
                  radius: 12
                  color: index === root.nieuweDomein ? Color.accent : "transparent"
                  border.width: 1
                  border.color: index === root.nieuweDomein ? Color.accent : Color.muted

                  Text {
                    id: chipTekst
                    anchors.centerIn: parent
                    text: modelData.label
                    color: index === root.nieuweDomein ? Color.background : root.barForeground
                    font.family: root.bar ? root.bar.fontFamily : Style.font.family
                    font.pixelSize: root.captionFont
                  }

                  MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.nieuweDomein = index
                  }
                }
              }

              Item { width: Style.space(6); height: 1 }

              Repeater {
                model: root.minutenKeuzes
                Rectangle {
                  required property var modelData
                  width: minTekst.implicitWidth + 14
                  height: 24
                  radius: 12
                  color: modelData === root.nieuweMinuten ? Color.accent : "transparent"
                  border.width: 1
                  border.color: modelData === root.nieuweMinuten ? Color.accent : Color.muted

                  Text {
                    id: minTekst
                    anchors.centerIn: parent
                    text: modelData
                    color: modelData === root.nieuweMinuten ? Color.background : root.barForeground
                    font.family: root.bar ? root.bar.fontFamily : Style.font.family
                    font.pixelSize: root.captionFont
                  }

                  MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.nieuweMinuten = modelData
                  }
                }
              }

              Rectangle {
                width: hoofdTekst.implicitWidth + 14
                height: 24
                radius: 12
                color: root.nieuweMain ? Color.accent : "transparent"
                border.width: 1
                border.color: root.nieuweMain ? Color.accent : Color.muted

                Text {
                  id: hoofdTekst
                  anchors.centerIn: parent
                  text: "Hoofd"
                  color: root.nieuweMain ? Color.background : root.barForeground
                  font.family: root.bar ? root.bar.fontFamily : Style.font.family
                  font.pixelSize: root.captionFont
                }

                MouseArea {
                  anchors.fill: parent
                  cursorShape: Qt.PointingHandCursor
                  onClicked: root.nieuweMain = !root.nieuweMain
                }
              }
            }
          }
        }

        Text {
          width: parent.width
          text: titelVeld.activeFocus
            ? "typ een titel · enter = toevoegen · esc = terug naar de lijst"
            : "↑↓ kiezen · enter = afvinken · d = naar morgen · s = wekker uitstellen · a = toevoegen · r = verversen · o = openen · esc = sluiten"
          color: Color.muted
          font.family: root.bar ? root.bar.fontFamily : Style.font.family
          font.pixelSize: root.captionFont
          wrapMode: Text.WordWrap
        }
      }
    }
  }

  Component.onCompleted: root.verversen()
}
