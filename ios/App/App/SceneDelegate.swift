import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    private var pendingURLContext: UIOpenURLContext?
    private var pendingUserActivity: NSUserActivity?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard scene is UIWindowScene else {
            return
        }

        /*
         Store cold-launch URLs until the scene becomes active.

         Forwarding them directly from willConnectTo can happen before
         Capacitor and the App plugin are ready to retain or emit the URL.
         */
        pendingURLContext = connectionOptions.urlContexts.first
        pendingUserActivity = connectionOptions.userActivities.first
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        flushPendingLaunchContexts()
    }

    func scene(
        _ scene: UIScene,
        openURLContexts URLContexts: Set<UIOpenURLContext>
    ) {
        guard let urlContext = URLContexts.first else {
            return
        }

        forward(urlContext)
    }

    func scene(
        _ scene: UIScene,
        continue userActivity: NSUserActivity
    ) {
        forward(userActivity)
    }

    private func flushPendingLaunchContexts() {
        let urlContext = pendingURLContext
        let userActivity = pendingUserActivity

        pendingURLContext = nil
        pendingUserActivity = nil

        guard urlContext != nil || userActivity != nil else {
            return
        }

        /*
         Wait until the next main run-loop turn after scene activation.
         This allows the storyboard, Capacitor bridge, and native plugins
         to finish their activation work first.
         */
        DispatchQueue.main.async { [weak self] in
            guard let self else {
                return
            }

            if let urlContext {
                self.forward(urlContext)
            }

            if let userActivity {
                self.forward(userActivity)
            }
        }
    }

    private func forward(_ urlContext: UIOpenURLContext) {
        var options: [UIApplication.OpenURLOptionsKey: Any] = [
            .openInPlace: urlContext.options.openInPlace,
        ]

        if let sourceApplication =
            urlContext.options.sourceApplication
        {
            options[.sourceApplication] = sourceApplication
        }

        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            open: urlContext.url,
            options: options
        )
    }

    private func forward(_ userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(
            UIApplication.shared,
            continue: userActivity,
            restorationHandler: { _ in }
        )
    }
}