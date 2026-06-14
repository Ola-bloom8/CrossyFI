// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PostcardNFT.sol";
import "../src/PostcardRouter.sol";
import "../src/interfaces/ISpokePool.sol";

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
}

contract MockSpokePool is ISpokePool {
    struct Deposit {
        address depositor;
        address recipient;
        address inputToken;
        address outputToken;
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 destinationChainId;
        address exclusiveRelayer;
        uint32 quoteTimestamp;
        uint32 fillDeadline;
        uint32 exclusivityDeadline;
        bytes message;
    }

    Deposit public lastDeposit;

    function depositV3(
        address depositor,
        address recipient,
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 outputAmount,
        uint256 destinationChainId,
        address exclusiveRelayer,
        uint32 quoteTimestamp,
        uint32 fillDeadline,
        uint32 exclusivityDeadline,
        bytes calldata message
    ) external payable {
        lastDeposit = Deposit({
            depositor: depositor,
            recipient: recipient,
            inputToken: inputToken,
            outputToken: outputToken,
            inputAmount: inputAmount,
            outputAmount: outputAmount,
            destinationChainId: destinationChainId,
            exclusiveRelayer: exclusiveRelayer,
            quoteTimestamp: quoteTimestamp,
            fillDeadline: fillDeadline,
            exclusivityDeadline: exclusivityDeadline,
            message: message
        });
    }
}

contract PostcardTest is Test {
    PostcardNFT nft;
    PostcardRouter router;
    MockSpokePool spokePool;
    MockUSDC usdc;

    address sender = makeAddr("sender");
    address recipient = makeAddr("recipient");

    function setUp() public {
        spokePool = new MockSpokePool();
        nft = new PostcardNFT();
        router = new PostcardRouter(address(spokePool), address(nft), "Base Sepolia");
        nft.setPaymentRouter(address(router));

        usdc = new MockUSDC();
        usdc.mint(sender, 100e6);
        vm.prank(sender);
        usdc.approve(address(router), 100e6);
    }

    function test_sendPayment_mintsPostcard() public {
        uint256 amount = 10e6;
        uint256 outputAmount = 9_990_000;
        uint32 quoteTimestamp = uint32(block.timestamp);
        uint32 fillDeadline = uint32(block.timestamp + 1 hours);

        vm.prank(sender);
        uint256 tokenId = router.sendPayment(
            recipient,
            address(usdc),
            amount,
            outputAmount,
            421614, // Arbitrum Sepolia
            "USDC",
            "Arbitrum Sepolia",
            "🎉",
            quoteTimestamp,
            fillDeadline
        );

        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(0), recipient);
        assertEq(nft.balanceOf(recipient), 1);

        PostcardNFT.Postcard memory p = nft.postcards(0);
        assertEq(p.sender, sender);
        assertEq(p.recipient, recipient);
        assertEq(p.amount, amount);
        assertEq(p.tokenSymbol, "USDC");
        assertEq(p.srcChainName, "Base Sepolia");
        assertEq(p.dstChainName, "Arbitrum Sepolia");
        assertEq(p.message, "🎉");

        string memory uri = nft.tokenURI(0);
        assertTrue(bytes(uri).length > 0);
        assertTrue(_startsWith(uri, "data:application/json;base64,"));

        MockSpokePool.Deposit memory d = spokePool.lastDeposit();
        assertEq(d.depositor, sender);
        assertEq(d.recipient, recipient);
        assertEq(d.inputAmount, amount);
        assertEq(d.outputAmount, outputAmount);
        assertEq(d.destinationChainId, 421614);
    }

    function _startsWith(string memory haystack, string memory prefix) internal pure returns (bool) {
        bytes memory h = bytes(haystack);
        bytes memory p = bytes(prefix);
        if (p.length > h.length) return false;
        for (uint256 i = 0; i < p.length; i++) {
            if (h[i] != p[i]) return false;
        }
        return true;
    }
}
