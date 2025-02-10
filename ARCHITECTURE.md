# Tab Movement Architecture

This diagram shows the flow of window content movement operations:

```mermaid
flowchart TD

  subgraph PL[Popup Loading]
    Start[Popup Opens] --> Init[Initialize Window]
    Init --> Pop[Populate Window List]
    Pop --> CreateOpt[Create Window Options]
    CreateOpt --> UpdateBtn[Update Undo Button]
  end

  PL --> |"User clicks
          window option"| WR
  PL --> |"User clicks
          undo / redo"| UR

  subgraph Workspace Move
    subgraph WR[Window Resolution]
      H1 --> Resolve[resolveDestinationWindow]
      Resolve --> |"new window"| Create[Create Window]
    end

    subgraph TM[Tab Movement]
      GetTabs[Get Source Window Tabs]
      GetTabs --> MoveTabs[Move All Tabs]
      MoveTabs --> Store[Store Move State]
    end

    subgraph UR[Undo / Redo]
      H2 --> Check{Is Redo?}
      Check -->|Yes| Redo[redoLastMove]
      Check -->|No| Undo[undoLastMove]
    end

    Create --> TM
    Resolve --> |"existing window"| TM
    Redo --> TM
    Undo --> TM
  end

  subgraph PMT[Post-Move Tasks]
    Preserve -->|Yes| AddDial[Add Speed Dial]
    Preserve -->|No| Clean[Clean Speed Dials]
    AddDial --> Clean
    Clean --> Close[Close Popup]
  end

    TM --> PMT
```
